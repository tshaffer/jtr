//
//  DeviceConnectionViewController.swift
//  JTR
//
//  Created by Classroom Tech User on 2/15/15.
//  Copyright (c) 2015 Classroom Tech User. All rights reserved.
//

import UIKit

class DeviceConnectionViewController: UIViewController {

    @IBOutlet weak var ipAddress: UITextField!
    
    
    @IBAction func connectToDevice(sender: AnyObject) {       
        Networking.connection.baseUrl = "http://" + ipAddress.text
        
        
        if Networking.connection.checkConnection() {
            self.performSegueWithIdentifier("deviceConnected", sender: self)
        } else {
            let alertController = UIAlertController(title: "Could not connect!", message:
                "", preferredStyle: UIAlertControllerStyle.Alert)
            alertController.addAction(UIAlertAction(title: "Dismiss", style: UIAlertActionStyle.Default,handler: nil))
            
            self.presentViewController(alertController, animated: true, completion: nil)
        }
      
    }
    
    override func viewDidLoad() {
        super.viewDidLoad()

        // Do any additional setup after loading the view.
    }

    override func didReceiveMemoryWarning() {
        super.didReceiveMemoryWarning()
        // Dispose of any resources that can be recreated.
    }
    

    /*
    // MARK: - Navigation

    // In a storyboard-based application, you will often want to do a little preparation before navigation
    override func prepareForSegue(segue: UIStoryboardSegue, sender: AnyObject?) {
        // Get the new view controller using segue.destinationViewController.
        // Pass the selected object to the new view controller.
        
        if segue.identifier == "deviceConnected" {
    
        }
    }
    */

}