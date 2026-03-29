import Array "mo:core/Array";
import Map "mo:core/Map";
import Text "mo:core/Text";
import Iter "mo:core/Iter";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import Order "mo:core/Order";
import Nat "mo:core/Nat";
import List "mo:core/List";
import Principal "mo:core/Principal";
import OutCall "http-outcalls/outcall";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import Migration "migration";

(with migration = Migration.run)
actor {
  module Message {
    public type Role = {
      #user;
      #assistant;
    };

    public type Message = {
      role : Role;
      content : Text;
      timestamp : Time.Time;
    };
  };
  type Message = Message.Message;

  module Conversation {
    public type Id = Nat;

    public type Conversation = {
      id : Id;
      title : Text;
      messages : [Message];
      createdAt : Time.Time;
      lastActivity : Time.Time;
    };

    public func compareByActivity(a : Conversation, b : Conversation) : Order.Order {
      if (a.lastActivity > b.lastActivity) {
        #less;
      } else if (a.lastActivity < b.lastActivity) { #greater } else {
        #equal;
      };
    };
  };
  type Conversation = Conversation.Conversation;

  public type UserProfile = {
    name : Text;
    // Add additional metadata fields as needed
  };

  type OpenAIModel = {
    #gpt4o;
    #gpt4;
    #gpt3_5;
  };

  var conversationHistory = Map.empty<Principal, Map.Map<Conversation.Id, Conversation>>();
  var conversationIdCounter = 0;
  var openAiApiKey : ?Text = null;

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);
  var userProfiles = Map.empty<Principal, UserProfile>();

  // User profile functions
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Helper function to get user's conversations
  func getUserConversations(caller : Principal) : Map.Map<Conversation.Id, Conversation> {
    switch (conversationHistory.get(caller)) {
      case (null) {
        let newMap = Map.empty<Conversation.Id, Conversation>();
        conversationHistory.add(caller, newMap);
        newMap;
      };
      case (?conversations) { conversations };
    };
  };

  // Get next conversation ID
  func getNextConversationId() : Conversation.Id {
    let id = conversationIdCounter;
    conversationIdCounter += 1;
    id;
  };

  // Transform function for HTTP outcall
  public query func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  public shared ({ caller }) func createConversation(title : Text) : async Conversation {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create conversations");
    };

    let id = getNextConversationId();
    let timestamp = Time.now();
    let emptyConversation : Conversation = {
      id;
      title;
      messages = [];
      createdAt = timestamp;
      lastActivity = timestamp;
    };

    let userConversations = getUserConversations(caller);
    userConversations.add(id, emptyConversation);
    conversationHistory.add(caller, userConversations);

    emptyConversation;
  };

  public shared ({ caller }) func sendMessage(conversationId : Conversation.Id, messageText : Text) : async Message {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can send messages");
    };

    let userConversations = getUserConversations(caller);

    let conversation = switch (userConversations.get(conversationId)) {
      case (null) { Runtime.trap("Conversation not found") };
      case (?conv) { conv };
    };

    let userMessage : Message = {
      role = #user;
      content = messageText;
      timestamp = Time.now();
    };

    // Add user message to conversation
    let updatedMessages = conversation.messages.concat([userMessage]);
    let updatedConversation : Conversation = {
      conversation with
      messages = updatedMessages;
      lastActivity = Time.now();
    };

    // Update conversation in user's conversations
    userConversations.add(conversationId, updatedConversation);

    // Update conversation history
    conversationHistory.add(caller, userConversations);

    // Get assistant reply from OpenAI
    let aiReply = await getOpenAiReply(updatedMessages);

    let assistantMessage : Message = {
      aiReply with
      timestamp = Time.now();
    };

    // Add assistant message to conversation
    let finalMessages = updatedMessages.concat([assistantMessage]);
    let finalConversation : Conversation = {
      updatedConversation with
      messages = finalMessages;
      lastActivity = Time.now();
    };

    // Update conversation with assistant reply
    userConversations.add(conversationId, finalConversation);
    conversationHistory.add(caller, userConversations);

    assistantMessage;
  };

  // Helper function to interact with OpenAI API (HTTP outcall)
  func getOpenAiReply(messages : [Message]) : async Message {
    switch (openAiApiKey) {
      case (null) { Runtime.trap("OpenAI API key not set") };
      case (?apiKey) {
        let url = "https://api.openai.com/v1/chat/completions";
        let prompt = messages.reverse()[0].content;

        let headers = [
          {
            name = "Content-Type";
            value = "application/json";
          },
          {
            name = "Authorization";
            value = "Bearer " # apiKey;
          },
        ];

        let body = "{
          \"model\": \"gpt-4\",
          \"messages\": [
            { \"role\": \"system\", \"content\": \"You are a helpful assistant.\" },
            { \"role\": \"user\", \"content\": \"" # prompt # "\" }
          ],
          \"max_tokens\": 128,
          \"temperature\": 0.7
        }";

        // HTTP POST request to OpenAI API
        let response = await OutCall.httpPostRequest(url, headers, body, transform);

        // Return new message
        {
          role = #assistant;
          content = response;
          timestamp = Time.now();
        };
      };
    };
  };

  public query ({ caller }) func getConversation(conversationId : Conversation.Id) : async Conversation {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view conversations");
    };

    let userConversations = getUserConversations(caller);
    switch (userConversations.get(conversationId)) {
      case (null) { Runtime.trap("Conversation not found") };
      case (?conversation) { conversation };
    };
  };

  public query ({ caller }) func getAllConversations() : async [Conversation] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view conversations");
    };

    let userConversations = getUserConversations(caller);
    userConversations.values().toArray().sort(Conversation.compareByActivity);
  };

  // Delete a specific conversation
  public shared ({ caller }) func deleteConversation(conversationId : Conversation.Id) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete conversations");
    };

    let userConversations = getUserConversations(caller);
    userConversations.remove(conversationId);
    conversationHistory.add(caller, userConversations);
  };

  public shared ({ caller }) func deleteAllConversations() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete conversations");
    };

    conversationHistory.remove(caller);
  };

  public shared ({ caller }) func setOpenAiApiKey(key : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can set the API key");
    };
    openAiApiKey := ?key;
  };
};
