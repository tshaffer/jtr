//
//  Networking.swift
//  JTR
//
//  Created by Classroom Tech User on 2/13/15.
//  Copyright (c) 2015 Classroom Tech User. All rights reserved.
//

import Foundation
import AVFoundation

private let networkConnection = Networking();

class Networking {
    var baseUrl : String? {
        didSet {
            if let url = baseUrl {
                port8080 = url + ":8080/"
                port8088 = url + ":8088/"
            }
        }
    }
    var port8080 : String?
    var port8088 : String?
    
    class var connection : Networking {
        return networkConnection
    }
    
    init() {
        
    }
    
    
    func executeCommand(cmd: String) {
        println("trying to execute command: \(cmd)")
        if let baseUrl = self.port8080 {
            if let url = NSURL(string: (baseUrl + cmd)) {
                let urlRequest = NSURLRequest(URL: url);
                var responseData: NSData = NSURLConnection.sendSynchronousRequest(urlRequest, returningResponse: nil, error: nil)!
                let json = JSON(data: responseData)
                if json != nil {
//                    println("json not nil")
                }
            }
        }
    }
    
    func deleteShow(recordingId: String) {
        //make a JSON object {recordingId : "<id>"} and send that
        
        if let baseUrl = port8080 {
            if let url = NSURL(string: (baseUrl + "deleteRecording")) {
                let urlRequest = NSURLRequest(URL: url);
                NSURLConnection.sendAsynchronousRequest(urlRequest, queue: NSOperationQueue.mainQueue(), completionHandler:
                    {(resp: NSURLResponse!, data: NSData!, error: NSError!) -> Void
                        in
                        //this is the "done" callback
                })
            }
        }
    }
    
    func getCurrentState() -> JSON? {
        var json : JSON?
        if let baseUrl = port8080 {
            if let url = NSURL(string: (baseUrl + "currentState")) {
                let urlRequest = NSURLRequest(URL: url);
                var responseData: NSData = NSURLConnection.sendSynchronousRequest(urlRequest, returningResponse: nil, error: nil)!
                json = JSON(data: responseData)
                if json != nil {
//                    println("\(json)")
                }
            }
        }
        return json
    }
    
    func checkConnection() -> Bool {
        //randomly using the recordings end-point to check if the device is alive, should update later
        
        var didWork = false
        if let baseUrl = port8080 {
            if let url = NSURL(string: (baseUrl + "recordings")) {
                let urlRequest = NSURLRequest(URL: url);
                var responseData: NSData = NSURLConnection.sendSynchronousRequest(urlRequest, returningResponse: nil, error: nil)!
                let json = JSON(data: responseData)
                if json != nil {
                    didWork = true
                }
            }
        }
        return didWork
    }
    
    func getRecordedShows() -> RecordedShows {
        var shows = RecordedShows()
        if let baseUrl = port8080 {
            if let url = NSURL(string: (baseUrl + "recordings")) {
                let urlRequest = NSURLRequest(URL: url);
                var responseData: NSData = NSURLConnection.sendSynchronousRequest(urlRequest, returningResponse: nil, error: nil)!
                let json = JSON(data: responseData)
                
                for (index, show) in json["recordings"] {
                    let recordedShow = RecordedShow()
                    recordedShow.recordingId = show["RecordingId"].stringValue
                    recordedShow.title = show["Title"].stringValue
                    recordedShow.dateRecorded = Networking.cleanDate(show["StartDateTime"].stringValue)
                    recordedShow.duration = show["Duration"].stringValue
                    recordedShow.transcodeComplete = show["TranscodeComplete"].stringValue
                    recordedShow.position = show["LastViewedPosition"].stringValue
                    recordedShow.time = Networking.cleanTime(show["StartDateTime"].stringValue)
                    
                    shows.recordedShows.append(recordedShow)
                }
            }
        }
        return shows
    }
    
    class func cleanTime(date : String) -> String {
        var hours = date.substringWithRange(Range<String.Index>(start: advance(date.startIndex, 11), end: advance(date.endIndex, -10)))
        let mins = date.substringWithRange(Range<String.Index>(start: advance(date.startIndex, 14), end: advance(date.endIndex, -7)))
        var amPm = ""
        if hours.toInt() > 11 {
            amPm = "PM"
            hours = String(hours.toInt()! - 12)
        } else {
            amPm = "AM"
        }
        
        return hours + ":" + mins + " " + amPm
    }
    
    class func cleanDate(date : String) -> String {
        let month = date.substringWithRange(Range<String.Index>(start: advance(date.startIndex, 5), end: advance(date.endIndex, -16)))
        let day = date.substringWithRange(Range<String.Index>(start: advance(date.startIndex, 8), end: advance(date.endIndex, -13)))
        let year = date.substringWithRange(Range<String.Index>(start: advance(date.startIndex, 2), end: advance(date.endIndex, -19)))
        return month + "/" + day + "/" + year
    }
    
    func createThumb(url : String) -> CGImage? {
        let assetUrl = NSURL(string: url)
        let asset: AVAsset = AVAsset.assetWithURL(assetUrl) as AVAsset
        let imageGenerator = AVAssetImageGenerator(asset: asset);
        let time = CMTimeMakeWithSeconds(1.0, 1)
        
        var actualTime : CMTime = CMTimeMake(0, 0)
        var error : NSError?
        let image = imageGenerator.copyCGImageAtTime(time, actualTime: &actualTime, error: &error)
        
        if error == nil {
            return image
        }
        return nil
        
    }
    
}