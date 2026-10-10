import UIKit
import Capacitor

// Capacitor auto-registers plugins that ship as npm packages. A plugin that
// lives in the app target has to be handed to the bridge by hand.
class MainViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        bridge?.registerPluginInstance(ScreenGuardPlugin())
    }
}
