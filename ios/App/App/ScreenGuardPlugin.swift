import Foundation
import Capacitor
import UIKit

@objc(ScreenGuardPlugin)
public class ScreenGuardPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "ScreenGuardPlugin"
    public let jsName = "ScreenGuard"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "isBeingCaptured", returnType: CAPPluginReturnPromise)
    ]

    override public func load() {
        NotificationCenter.default.addObserver(self,
            selector: #selector(screenshotTaken),
            name: UIApplication.userDidTakeScreenshotNotification, object: nil)
        NotificationCenter.default.addObserver(self,
            selector: #selector(captureStateChanged),
            name: UIScreen.capturedDidChangeNotification, object: nil)
    }

    deinit { NotificationCenter.default.removeObserver(self) }

    @objc func screenshotTaken() {
        notifyListeners("screenshotTaken", data: [:])
    }

    @objc func captureStateChanged() {
        notifyListeners("captureStateChanged", data: ["captured": UIScreen.main.isCaptured])
    }

    @objc func isBeingCaptured(_ call: CAPPluginCall) {
        DispatchQueue.main.async { call.resolve(["captured": UIScreen.main.isCaptured]) }
    }
}
