//
//  ToDoListTableViewController.swift
//  JTR
//
//  Created by Classroom Tech User on 3/16/15.
//  Copyright (c) 2015 Classroom Tech User. All rights reserved.
//

import UIKit

class ToDoListTableViewController: UITableViewController {
    
    // MARK: - Table view data source

    override func numberOfSectionsInTableView(tableView: UITableView) -> Int {
        return 1
    }

    override func tableView(tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
        let count = theToDoListManager.toDoItems.count
        return count
    }
    
    override func tableView(tableView: UITableView, cellForRowAtIndexPath indexPath: NSIndexPath) -> UITableViewCell {
        let cell = tableView.dequeueReusableCellWithIdentifier("toDoCell", forIndexPath: indexPath) as UITableViewCell

        let toDoItem = theToDoListManager.toDoItems[indexPath.row]
        
        cell.textLabel?.text = toDoItem.title
        cell.detailTextLabel?.text = toDoItem.date

        return cell
    }

    override func tableView(tableView: UITableView, commitEditingStyle editingStyle: UITableViewCellEditingStyle, forRowAtIndexPath indexPath: NSIndexPath) {
        if editingStyle == UITableViewCellEditingStyle.Delete {
            theToDoListManager.removeElem(indexPath.row)
            tableView.deleteRowsAtIndexPaths([indexPath], withRowAnimation: UITableViewRowAnimation.Automatic)
        }
    }


    /*
    // MARK: - Navigation

    // In a storyboard-based application, you will often want to do a little preparation before navigation
    override func prepareForSegue(segue: UIStoryboardSegue, sender: AnyObject?) {
        // Get the new view controller using [segue destinationViewController].
        // Pass the selected object to the new view controller.
    }
    */

}
