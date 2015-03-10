//
//  RecordedShowViewController.swift
//  JTR
//
//  Created by Classroom Tech User on 2/15/15.
//  Copyright (c) 2015 Classroom Tech User. All rights reserved.
//

import UIKit

class RecordedShowViewController: UIViewController {
    var recordedShow : RecordedShow = RecordedShow()
    
    @IBOutlet weak var titleLabel: UILabel!
    @IBOutlet weak var dateLabel: UILabel!
    @IBOutlet weak var thumbnail: UIImageView!
    
    override func viewDidLoad() {
        super.viewDidLoad()
        println("\(recordedShow.title)")
        titleLabel.text = recordedShow.title
        dateLabel.text = recordedShow.dateRecorded + " " + recordedShow.time
        
    }

    override func didReceiveMemoryWarning() {
        super.didReceiveMemoryWarning()
        // Dispose of any resources that can be recreated.
    }

    @IBAction func deleteButtonPress(sender: AnyObject) {
        println("delete button pressed")
    }
    
    @IBAction func playShow(sender: AnyObject) {
        //the play specific show command
    }
    
    @IBAction func streamShow(sender: AnyObject) {
    
    }
    
    // MARK: - Navigation

    // In a storyboard-based application, you will often want to do a little preparation before navigation
    override func prepareForSegue(segue: UIStoryboardSegue, sender: AnyObject?) {
        // Get the new view controller using segue.destinationViewController.
        // Pass the selected object to the new view controller.
        
        
        if segue.identifier == "videoStreamer" {
            let videoStreamerVC = segue.destinationViewController as VideoStreamerViewController
            videoStreamerVC.urlString = "http://192.168.1.24:8080/file:///file_index.m3u8"
        }
    }

}
