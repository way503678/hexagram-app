import ExpoModulesCore
import StoreKit

public final class MingoStoreKitModule: Module {
  public func definition() -> ModuleDefinition {
    Name("MingoStoreKit")

    AsyncFunction("getSignedAppTransaction") { () async throws -> String? in
      guard #available(iOS 16.0, *) else {
        return nil
      }

      let result = try await AppTransaction.shared
      switch result {
      case .verified:
        return result.jwsRepresentation
      case .unverified:
        return nil
      }
    }
  }
}
