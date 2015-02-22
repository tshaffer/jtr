//
//  StreamingVideoViewController.swift
//  JTR
//
//  Created by Classroom Tech User on 2/21/15.
//  Copyright (c) 2015 Classroom Tech User. All rights reserved.
//

import UIKit
import MediaPlayer

class StreamingVideoViewController: UIViewController {
    var streamer : MPMoviePlayerController!
    
    override func viewDidLoad() {
        super.viewDidLoad()

        playVideo()
    }

    override func didReceiveMemoryWarning() {
        super.didReceiveMemoryWarning()
        // Dispose of any resources that can be recreated.
    }
    

    func playVideo() {
        let url = NSURL(fileURLWithPath: "http://192.168.1.24:8080/file:///file_index.m3u8")
        streamer = MPMoviePlayerController(contentURL: url)
        
        streamer.view.frame = CGRect(x: 20, y: 100, width: 200, height: 150)
        
        self.view.addSubview(streamer.view)
        
        streamer.fullscreen = true
        
        streamer.controlStyle = MPMovieControlStyle.Embedded
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
