//
//  Networking.swift
//  JTR
//
//  Created by Classroom Tech User on 2/13/15.
//  Copyright (c) 2015 Classroom Tech User. All rights reserved.
//

import Foundation
import AVFoundation
import UIKit

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
    let thumbBaseUrl = "http://ec2-54-191-146-217.us-west-2.compute.amazonaws.com/staging/img/"
    
    
    class var connection : Networking {
        return networkConnection
    }
    
    init() {
        
    }
    
    func getThumbUrl() -> String {
        return thumbBaseUrl
    }
    
    func getStreamUrl(recordingId : String) -> JSON? {
        var json : JSON? = nil
        if let baseUrl = self.port8080 {
            if let url = NSURL(string: (baseUrl + "hlsUrl?recordingId=" + recordingId)) {
                let urlRequest = NSURLRequest(URL: url);
                var responseData: NSData = NSURLConnection.sendSynchronousRequest(urlRequest, returningResponse: nil, error: nil)!
                json = JSON(data: responseData)
                println("\(json)")
            }
        }
        return json
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
                    recordedShow.fullDate = show["StartDateTime"].stringValue
                    
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
    
    class func createFileName(date : String) -> String {
        let month = date.substringWithRange(Range<String.Index>(start: advance(date.startIndex, 5), end: advance(date.endIndex, -16)))
        let day = date.substringWithRange(Range<String.Index>(start: advance(date.startIndex, 8), end: advance(date.endIndex, -13)))
        let year = date.substringWithRange(Range<String.Index>(start: advance(date.startIndex, 0), end: advance(date.endIndex, -19)))
        var hours = date.substringWithRange(Range<String.Index>(start: advance(date.startIndex, 11), end: advance(date.endIndex, -10)))
        let mins = date.substringWithRange(Range<String.Index>(start: advance(date.startIndex, 14), end: advance(date.endIndex, -7)))
        let seconds = date.substringWithRange(Range<String.Index>(start: advance(date.startIndex, 17), end: advance(date.endIndex, -4)))
        
        let rtn = year + month + day + "T" + hours + mins + seconds + ".png"
        
        return rtn
    }
    
    class func resizeImage(image: UIImage?, targetSize: CGSize) -> UIImage? {
        if let image = image? {
            let size = image.size
            
            let widthRatio  = targetSize.width  / image.size.width
            let heightRatio = targetSize.height / image.size.height
            
            // Figure out what our orientation is, and use that to form the rectangle
            var newSize: CGSize
            if(widthRatio > heightRatio) {
                newSize = CGSizeMake(size.width * heightRatio, size.height * heightRatio)
            } else {
                newSize = CGSizeMake(size.width * widthRatio,  size.height * widthRatio)
            }
            
            // This is the rect that we've calculated out and this is what is actually used below
            let rect = CGRectMake(0, 0, newSize.width, newSize.height)
            
            // Actually do the resizing to the rect using the ImageContext stuff
            UIGraphicsBeginImageContextWithOptions(newSize, false, UIScreen.mainScreen().scale)
            image.drawInRect(rect)
            let newImage = UIGraphicsGetImageFromCurrentImageContext()
            UIGraphicsEndImageContext()
            
            return newImage
        }
        
        return nil
    }

}