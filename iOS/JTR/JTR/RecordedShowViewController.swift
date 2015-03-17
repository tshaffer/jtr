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
    @IBOutlet weak var progressBar: UIProgressView!
    @IBOutlet weak var streamButton: UIButton!
    @IBOutlet weak var stateLabel: UILabel!
    
    @IBOutlet weak var quickSkipBtn: UIButton!
    @IBOutlet weak var pauseBtn: UIButton!
    @IBOutlet weak var playBtn: UIButton!
    @IBOutlet weak var instantReplayBtn: UIButton!
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        titleLabel.text = recordedShow.title
        dateLabel.text = recordedShow.dateRecorded + " " + recordedShow.time
        updateProgresBar()
        
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

    @IBAction func deleteButtonPress(sender: AnyObject) {
        net.executeCommand("deleteRecording?recordingId=" + recordedShow.recordingId)
        updateProgresBar()
    }
    
    @IBAction func playShow(sender: AnyObject) {
        if stateLabel.text == "State: not playing" {
            net.executeCommand("recording?recordingId=" + recordedShow.recordingId)
            net.executeCommand("pause")
            net.executeCommand("play")
        } else {
            net.executeCommand("play")
        }
        updateProgresBar()
    }
    
    @IBAction func pause(sender: AnyObject) {
        net.executeCommand("pause")
        updateProgresBar()
    }
    
    @IBAction func quickSkip(sender: AnyObject) {
        net.executeCommand("quickSkip")
        updateProgresBar()
    }
    
    @IBAction func instantReplay(sender: AnyObject) {
        net.executeCommand("instantReplay")
        updateProgresBar()
    }
    
    func updateProgresBar() {
        let json = net.getCurrentState()
        if let valid = json {
            let state = valid["currentstate"]["state"].stringValue
            
            if state != "idle" {
                let currentTime = valid["currentstate"]["currenttime"].floatValue
                let totalTime = valid["currentstate"]["duration"].floatValue * 60
                let progress = currentTime / totalTime
                progressBar.setProgress(progress, animated: true)
                
                let currentlyPlayingShowId = valid["currentstate"]["recordingid"].stringValue
                if currentlyPlayingShowId == recordedShow.recordingId {
                    stateLabel.text = "State: " + state
                    progressBar.hidden = false
                    instantReplayBtn.hidden = false
                    pauseBtn.hidden = false
                    quickSkipBtn.hidden = false
                } else { //this show is NOT playing
                    progressBar.hidden = true
                    instantReplayBtn.hidden = true
                    pauseBtn.hidden = true
                    quickSkipBtn.hidden = true
                }
            } else {
                progressBar.setProgress(0.0, animated: true)
            }
        }
    }
    
    
    // MARK: - Navigation

    override func prepareForSegue(segue: UIStoryboardSegue, sender: AnyObject?) {
        if segue.identifier == "videoStreamer" {
            let videoStreamerVC = segue.destinationViewController as VideoStreamerViewController
            let json = net.getStreamUrl(recordedShow.recordingId)
            if let valid = json {
                let url = "file://" + valid["hlsurl"].stringValue
                videoStreamerVC.urlString = url
            }
        }
    }

}
