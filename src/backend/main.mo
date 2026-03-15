import Map "mo:core/Map";
import Text "mo:core/Text";
import Iter "mo:core/Iter";
import Runtime "mo:core/Runtime";

actor {
  public type Memories = {
    id : Nat;
    title : Text;
    date : Text;
    description : Text;
  };

  public type AppSettings = {
    friendName : Text;
    anniversaryDate : Text;
    personalLetter : Text;
  };

  var nextMemoryId = 0;
  var appSettings : ?AppSettings = null;

  let memories = Map.empty<Nat, Memories>();

  public shared ({ caller }) func setAppSettings(settings : AppSettings) : async () {
    appSettings := ?settings;
  };

  public query ({ caller }) func getAppSettings() : async AppSettings {
    switch (appSettings) {
      case (null) { Runtime.trap("No app settings found") };
      case (?settings) { settings };
    };
  };

  public shared ({ caller }) func addMemory(title : Text, date : Text, description : Text) : async Nat {
    let memory : Memories = {
      id = nextMemoryId;
      title;
      date;
      description;
    };
    memories.add(nextMemoryId, memory);
    nextMemoryId += 1;
    memory.id;
  };

  public shared ({ caller }) func updateMemory(id : Nat, title : Text, date : Text, description : Text) : async () {
    switch (memories.get(id)) {
      case (null) { Runtime.trap("Memory not found") };
      case (?_) {
        let updatedMemory : Memories = {
          id;
          title;
          date;
          description;
        };
        memories.add(id, updatedMemory);
      };
    };
  };

  public shared ({ caller }) func deleteMemory(id : Nat) : async () {
    switch (memories.get(id)) {
      case (null) { Runtime.trap("Memory not found") };
      case (?_) {
        memories.remove(id);
      };
    };
  };

  public query ({ caller }) func listMemories() : async [Memories] {
    memories.values().toArray();
  };
};
