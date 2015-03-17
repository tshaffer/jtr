//
//  ManualRecordViewController.swift
//  JTR
//
//  Created by Classroom Tech User on 2/15/15.
//  Copyright (c) 2015 Classroom Tech User. All rights reserved.
//

import UIKit

class ManualRecordViewController: UIViewController {
    
    @IBOutlet weak var titleLabel: UITextField!
    @IBOutlet weak var durationLabel: UITextField!
    @IBOutlet weak var channelLabel: UITextField!
    @IBOutlet weak var datePicker: UIDatePicker!
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        let currentDate = NSDate()
        datePicker.minimumDate = currentDate
        datePicker.date = currentDate
    }
    
    func dateFormat(date : NSDate) -> String {
        let dateFormatter = NSDateFormatter()
        var theDateFormat = NSDateFormatterStyle.ShortStyle
        let theTimeFormat = NSDateFormatterStyle.ShortStyle
        
        dateFormatter.dateStyle = theDateFormat
        dateFormatter.timeStyle = theTimeFormat
        
        let dateString =  dateFormatter.stringFromDate(date)
        return dateString
    }
    
    func showAlert() {
        let alertController = UIAlertController(title: "New Recording Created!", message:
            "", preferredStyle: UIAlertControllerStyle.Alert)
        alertController.addAction(UIAlertAction(title: "Dismiss", style: UIAlertActionStyle.Default,handler: nil))
        self.presentViewController(alertController, animated: true, completion: nil)
    }
    
    func clearFields() {
        titleLabel.text = ""
        durationLabel.text = ""
        channelLabel.text = ""
        datePicker.date = NSDate()
    }
    
    @IBAction func createRecording(sender: AnyObject) {
        let title = titleLabel.text
        let duration = durationLabel.text.toInt()
        let channel = channelLabel.text
        let date  = dateFormat(datePicker.date)
        
        let newToDoItem = ToDoItem(title: title, duration: duration!, channel: channel, date: date)
        theToDoListManager.addNewToDoItem(newToDoItem)
        
        showAlert()
        clearFields()
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
