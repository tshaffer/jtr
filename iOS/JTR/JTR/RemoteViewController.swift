//
//  RemoteViewController.swift
//  JTR
//
//  Created by Classroom Tech User on 2/13/15.
//  Copyright (c) 2015 Classroom Tech User. All rights reserved.
//

import UIKit

class RemoteViewController: UIViewController {
    let network = Networking.connection
    
//    TODO: need to add highest speed FF, highest speed RR
    
    @IBAction func homeBtn(sender: AnyObject) {
//        network.executeCommand("home")
        //should show main menu (and clear the background?)
    }
    
    @IBAction func playBtn(sender: AnyObject) {
        network.executeCommand("play")
    }
    
    @IBAction func pauseBtn(sender: AnyObject) {
        network.executeCommand("pause")
    }
    
    @IBAction func rewindBtn(sender: AnyObject) {
        network.executeCommand("rewind")
    }
    
    @IBAction func instantReplayBtn(sender: AnyObject) {
        network.executeCommand("instantReplay")
    }
    
    @IBAction func stopBtn(sender: AnyObject) {
        network.executeCommand("stop")
    }
    
    @IBAction func quickSkipBtn(sender: AnyObject) {
        network.executeCommand("quickSkip")
    }
    
    @IBAction func fastForwardBtn(sender: AnyObject) {
        network.executeCommand("fastForward")
    }
    
    @IBAction func deleteBtn(sender: AnyObject) {
        let json = network.getCurrentState()
        if let valid = json {
            let id = valid["currentstate"]["recordingid"].stringValue
            network.deleteShow(id)
        }
    }
    
    @IBAction func upArrowBtn(sender: AnyObject) {
        network.executeCommand("up")
    }
    
    @IBAction func downArrowBtn(sender: AnyObject) {
        network.executeCommand("down")
    }
    
    @IBAction func leftArrowBtn(sender: AnyObject) {
        network.executeCommand("left")
    }
    
    @IBAction func rightArrowBtn(sender: AnyObject) {
        network.executeCommand("right")
    }
    
    @IBAction func selectBtn(sender: AnyObject) {
        network.executeCommand("select")
    }
    
    @IBAction func exitBtn(sender: AnyObject) {
        network.executeCommand("exit")
    }
    
    @IBAction func jumpBtn(sender: AnyObject) {
        network.executeCommand("jump")
    }
    

    /*
    // MARK: - Navigation

    // In a storyboard-based application, you will often want to do a little preparation before navigation
    override func prepareForSegue(segue: UIStoryboardSegue, sender: AnyObject?) {
        // Get the new view controller using segue.destinationViewController.
        // Pass the selected object to the new view controller.
    }
    */

}
