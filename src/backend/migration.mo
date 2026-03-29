import Principal "mo:core/Principal";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Time "mo:core/Time";

module {
  type Role = { #user; #assistant };

  type OldActor = {
    conversationHistory : Map.Map<Principal, Map.Map<Nat, OldConversation>>;
    conversationIdCounter : Nat;
    openAiApiKey : ?Text;
    userProfiles : Map.Map<Principal, { name : Text }>;
  };

  type Message = {
    role : Role;
    content : Text;
    timestamp : Time.Time;
  };

  type OldConversation = {
    id : Nat;
    title : Text;
    messages : [Message];
    createdAt : Time.Time;
    lastActivity : Time.Time;
  };

  type NewActor = {
    conversationHistory : Map.Map<Principal, Map.Map<Nat, OldConversation>>;
    conversationIdCounter : Nat;
    openAiApiKey : ?Text;
    userProfiles : Map.Map<Principal, { name : Text }>;
  };

  public func run(old : OldActor) : NewActor {
    old;
  };
};
