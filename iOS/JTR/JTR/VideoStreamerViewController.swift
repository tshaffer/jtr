//
//  VideoStreamerViewController.swift
//  JTR
//
//  Created by Classroom Tech User on 2/22/15.
//  Copyright (c) 2015 Classroom Tech User. All rights reserved.
//

import UIKit

class VideoStreamerViewController: UIViewController {
    var net = Networking.connection
    @IBOutlet weak var webView: UIWebView!
    
    var urlString: String?
    
    override func viewDidLoad() {
        super.viewDidLoad()
        loadWebPage()
        
    }
    
    func loadWebPage() {
        if let urlString = urlString? {
            let fullUrl = net.port8088! + urlString
            if let url = NSURL(string: fullUrl) {
                let urlRequest = NSURLRequest(URL: url)
                webView.loadRequest(urlRequest)
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
