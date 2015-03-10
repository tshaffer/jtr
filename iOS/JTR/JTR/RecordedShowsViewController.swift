//
//  RecordedShowsViewController.swift
//  JTR
//
//  Created by Classroom Tech User on 2/13/15.
//  Copyright (c) 2015 Classroom Tech User. All rights reserved.
//

import UIKit

class RecordedShowsViewController: UIViewController, UITableViewDataSource, UITableViewDelegate {
    let cellIdentifier = "RecordedShowsCell"
    var shows : RecordedShows?
    @IBOutlet weak var recordedShowsTable: UITableView!
    var titleForward = true
    var dateForward = true
    
    @IBAction func clickSort(sender: AnyObject) {
        let segment = sender as UISegmentedControl
        let segIndex = segment.selectedSegmentIndex
        
        if segIndex == 0 {
            shows?.recordedShows.sort({ $0.title < $1.title })
        
        } else {
            shows?.recordedShows.sort({ $0.dateRecorded > $1.dateRecorded })
        }
        recordedShowsTable.reloadData()
    }
    
    required init(coder aDecoder: NSCoder) {
        super.init(coder: aDecoder)
    }
    
    override func viewDidLoad() {
        super.viewDidLoad()
        shows = Networking.connection.getRecordedShows()
        recordedShowsTable.reloadData()
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
        var recordedShows : RecordedShows
        
        if self.shows?.recordedShows != nil && self.shows?.recordedShows.count > 0 {
            recordedShows = self.shows!
        } else {
            recordedShows = Networking.connection.getRecordedShows()
        }

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
