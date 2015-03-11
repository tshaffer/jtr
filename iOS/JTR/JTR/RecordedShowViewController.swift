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
    var net = Networking.connection
    
    @IBOutlet weak var titleLabel: UILabel!
    @IBOutlet weak var dateLabel: UILabel!
    @IBOutlet weak var thumbnail: UIImageView!
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        titleLabel.text = recordedShow.title
        dateLabel.text = recordedShow.dateRecorded + " " + recordedShow.time
        
        if recordedShow.img != nil {
            self.thumbnail?.image = recordedShow.img
        } else {
            let date = recordedShow.fullDate
            let urlString = net.getThumbUrl() + Networking.createFileName(date)
            
            if let url = NSURL(string: urlString) {
                let urlRequest = NSURLRequest(URL: url)
                let targetSize = thumbnail?.frame.size
                
                dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_LOW, 0)) {
                    if let data = NSURLConnection.sendSynchronousRequest(urlRequest, returningResponse: nil, error: nil)? {
                        let image = UIImage(data: data)
                        if let smallImage = Networking.resizeImage(image, targetSize: targetSize!) {
                            
                            dispatch_async(dispatch_get_main_queue()) {
                                self.thumbnail?.image = smallImage
                                self.recordedShow.img = smallImage
                                return
                            }
                        }
                    }
                }
            }
        }
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
        net.executeCommand("recording?recordingId=" + recordedShow.recordingId)
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
