//
//  VideoStreamerViewController.swift
//  JTR
//
//  Created by Classroom Tech User on 2/22/15.
//  Copyright (c) 2015 Classroom Tech User. All rights reserved.
//

import UIKit

class VideoStreamerViewController: UIViewController {

    @IBOutlet weak var webView: UIWebView!
    
    var urlString: String? {
        didSet {
            loadWebPage()
        }
    }
    
    override func viewDidLoad() {
        super.viewDidLoad()

        loadWebPage()
    }

    override func didReceiveMemoryWarning() {
        super.didReceiveMemoryWarning()
        // Dispose of any resources that can be recreated.
    }
    
    @IBAction func button(sender: AnyObject) {
        urlString = "http://192.168.1.24:8080/file:///file_index.m3u8"
    }
    func loadWebPage() {
        if let urlString = urlString? {
            if let url = NSURL(string: urlString) {
                let urlRequest = NSURLRequest(URL: url)
                webView?.loadRequest(urlRequest)
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
