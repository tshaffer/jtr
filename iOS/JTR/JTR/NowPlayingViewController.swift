//
//  NowPlayingViewController.swift
//  JTR
//
//  Created by Classroom Tech User on 3/7/15.
//  Copyright (c) 2015 Classroom Tech User. All rights reserved.
//

import UIKit

class NowPlayingViewController: UIViewController {
    var net : Networking = Networking()
    
    @IBOutlet weak var showTitle: UILabel!
    @IBOutlet weak var thumbnail: UIImageView!
    @IBOutlet weak var dateRecorded: UILabel!
    @IBOutlet weak var progressBar: UIProgressView!
    
    
    override func viewDidLoad() {
        super.viewDidLoad()

        // Do any additional setup after loading the view.
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
    }
    
    @IBAction func pause(sender: AnyObject) {
        net.executeCommand("pause")
        updateProgresBar("pause")
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
