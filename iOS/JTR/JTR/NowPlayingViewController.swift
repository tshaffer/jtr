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
                stateLabel.text = "State: " + valid["currentstate"]["state"].stringValue
            }
        }
    }
    
    @IBOutlet weak var showTitle: UILabel!
    @IBOutlet weak var thumbnail: UIImageView!
    @IBOutlet weak var dateRecorded: UILabel!
    @IBOutlet weak var progressBar: UIProgressView!
    @IBOutlet weak var stateLabel: UILabel!
    
    var img : UIImage? = nil
    var currentImgFileName : String? = nil
    
    override func viewDidLoad() {
        super.viewDidLoad()
    }
    
    override func viewWillAppear(animated: Bool) {
        json = net.getCurrentState()
        
        progressBar.setProgress(0.2, animated: true)
        
        if let valid = json {
            let date = valid["currentstate"]["recordingdate"].stringValue
            let urlString = net.getThumbUrl() + Networking.createFileName(date)
            
            if img != nil && currentImgFileName == date {
                self.thumbnail?.image = img
            } else {
                if let url = NSURL(string: urlString) {
                    let urlRequest = NSURLRequest(URL: url)
                    let targetSize = thumbnail?.frame.size
                    
                    dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_LOW, 0)) {
                        if let data = NSURLConnection.sendSynchronousRequest(urlRequest, returningResponse: nil, error: nil)? {
                            let image = UIImage(data: data)
                            if let smallImage = Networking.resizeImage(image, targetSize: targetSize!) {
                                
                                dispatch_async(dispatch_get_main_queue()) {
                                    self.thumbnail?.image = smallImage
                                    self.img = smallImage
                                    self.currentImgFileName = date
                                    return
                                }
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
    
    @IBAction func instantReplay(sender: AnyObject) {
        progressBar.setProgress(0.6, animated: true)
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
