//
//  NowPlayingViewController.swift
//  JTR
//
//  Created by Classroom Tech User on 3/7/15.
//  Copyright (c) 2015 Classroom Tech User. All rights reserved.
//

import UIKit

class NowPlayingViewController: UIViewController {
    let net = Networking.connection
    var json : JSON? {
        didSet {
            if let valid = json {
                showTitle.text = valid["currentstate"]["title"].stringValue
                var dateString = valid["currentstate"]["recordingdate"].stringValue
                var date = Networking.cleanDate(dateString)
                var time = Networking.cleanTime(dateString)
                dateRecorded.text = date + " " + time
                let cgImage = net.createThumb("http://192.168.1.28:8080/content/20150203T180230.mp4")
                if let cgImg = cgImage {
                    let img = UIImage.init(CGImage: cgImage)
                    thumbnail.image = img
                }
                stateLabel.text = "State: " + valid["currentstate"]["state"].stringValue
            }
        }
    }
    
    @IBOutlet weak var showTitle: UILabel!
    @IBOutlet weak var thumbnail: UIImageView!
    @IBOutlet weak var dateRecorded: UILabel!
    @IBOutlet weak var progressBar: UIProgressView!
    @IBOutlet weak var stateLabel: UILabel!
    
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        json = net.getCurrentState()
    }

    override func didReceiveMemoryWarning() {
        super.didReceiveMemoryWarning()
        // Dispose of any resources that can be recreated.
    }
    
    @IBAction func instantReplay(sender: AnyObject) {
        net.executeCommand("instantReplay")
        updateProgresBar("instantReplay")
    }

    @IBAction func play(sender: AnyObject) {
        net.executeCommand("play")
        updateProgresBar("play")
        json = net.getCurrentState()
    }
    
    @IBAction func pause(sender: AnyObject) {
        net.executeCommand("pause")
        updateProgresBar("pause")
        json = net.getCurrentState()
    }
    
    @IBAction func quickSkip(sender: AnyObject) {
        net.executeCommand("quickSkip")
        updateProgresBar("quickSkip")
    }
    
    func updateProgresBar(cmd : String?) {
        if let command = cmd {
            if command == "instantReplay" {
                
            } else if command == "play" {
                
            } else if command == "pause" {
                
            } else if command == "quickSkip" {
                
            }
        }
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
