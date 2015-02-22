//
//  RecordedShowsViewController.swift
//  JTR
//
//  Created by Classroom Tech User on 2/13/15.
//  Copyright (c) 2015 Classroom Tech User. All rights reserved.
//

import UIKit

class RecordedShowsViewController: UIViewController, UITableViewDataSource, UITableViewDelegate {
    let network = Networking("192.168.1.24")
    let cellIdentifier = "RecordedShowsCell"
    var shows : RecordedShows?
    @IBOutlet weak var recordedShowsTable: UITableView!
    
    required init(coder aDecoder: NSCoder) {
        super.init(coder: aDecoder)
    }
    
    override func viewDidLoad() {
        super.viewDidLoad()
        shows = network.getRecordedShows()
        recordedShowsTable.reloadData()
    }

    override func didReceiveMemoryWarning() {
        super.didReceiveMemoryWarning()
        // Dispose of any resources that can be recreated.
    }
    
    
    func numberOfSectionsInTableView(tableView: UITableView) -> Int {
        return 1
    }
    
    func tableView(tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
        if let shows = shows {
            return shows.recordedShows.count
        }
        
        return 0
    }
    
    func tableView(tableView: UITableView, cellForRowAtIndexPath indexPath: NSIndexPath) -> UITableViewCell {
        let cell = tableView.dequeueReusableCellWithIdentifier(cellIdentifier, forIndexPath: indexPath) as RecordedShowsTableViewCell
        
        let row = indexPath.row
        
        let recordedShows = network.getRecordedShows()
        cell.titleLabel.text = recordedShows.recordedShows[row].title
        cell.dateLabel.text = recordedShows.recordedShows[row].dateRecorded

//        cell.titleLabel.text = "hello"
//        cell.dateLabel.text = "world"

        cell.show = shows?.recordedShows[row]
        
        return cell
    }
    
    func tableView(tableView: UITableView, didSelectRowAtIndexPath indexPath: NSIndexPath) {
        tableView.deselectRowAtIndexPath(indexPath, animated: true)
        
        let row = indexPath.row
    }


    
    // MARK: - Navigation

    // In a storyboard-based application, you will often want to do a little preparation before navigation
    override func prepareForSegue(segue: UIStoryboardSegue, sender: AnyObject?) {
        // Get the new view controller using segue.destinationViewController.
        // Pass the selected object to the new view controller.
        
        if segue.identifier == "toRecordedShow" {
            if let recordedShowVC = segue.destinationViewController as? RecordedShowViewController {
                
                if let aShowCell = sender as? RecordedShowsTableViewCell {
                    if let show = aShowCell.show? {
                        recordedShowVC.recordedShow = show
                    }
                }
            }
        }
    }


}
