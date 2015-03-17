//
//  ToDoModel.swift
//  JTR
//
//  Created by Classroom Tech User on 3/16/15.
//  Copyright (c) 2015 Classroom Tech User. All rights reserved.
//

import Foundation

//***The below code was adapted from a tutorial available here:***
//http://www.thinkingswiftly.com/saving-spritekit-game-data-swift-easy-nscoder/

var theToDoListManager = ToDoListManager()

class ToDoItem: NSObject, NSCoding {
    var title : String
    var duration : Int
    var channel : String
    var date : String
    
    
    init(title : String, duration : Int, channel : String, date : String) {
        self.title = title
        self.duration = duration
        self.channel = channel
        self.date = date
    }
    
    required init(coder: NSCoder) {
        self.title = coder.decodeObjectForKey("title")! as String
        self.duration = coder.decodeObjectForKey("duration")! as Int
        self.channel = coder.decodeObjectForKey("channel")! as String
        self.date = coder.decodeObjectForKey("date")! as String
        
        super.init()
    }
    
    func encodeWithCoder(coder: NSCoder) {
        coder.encodeObject(self.title, forKey: "title")
        coder.encodeObject(self.duration, forKey: "duration")
        coder.encodeObject(self.channel, forKey: "channel")
        coder.encodeObject(self.date, forKey: "date")
    }
}

class ToDoListManager {
    var toDoItems : Array<ToDoItem> = [];
    
    init() {
        let paths = NSSearchPathForDirectoriesInDomains(.DocumentDirectory, .UserDomainMask, true)
        let documentsDirectory = paths[0] as String
        let path = documentsDirectory.stringByAppendingPathComponent("ToDoItems.plist")
        let fileManager = NSFileManager.defaultManager()
        
        if !fileManager.fileExistsAtPath(path) {
            if let bundle = NSBundle.mainBundle().pathForResource("DefaultFile", ofType: "plist") {
                fileManager.copyItemAtPath(bundle, toPath: path, error:nil)
            }
        }
        
        if let rawData = NSData(contentsOfFile: path) {
            var toDoItemsArray: AnyObject? = NSKeyedUnarchiver.unarchiveObjectWithData(rawData);
            self.toDoItems = toDoItemsArray as? [ToDoItem] ?? [];
        }
    }
    
    func save() {
        let saveData = NSKeyedArchiver.archivedDataWithRootObject(self.toDoItems);
        let paths = NSSearchPathForDirectoriesInDomains(.DocumentDirectory, .UserDomainMask, true) as NSArray;
        let documentsDirectory = paths.objectAtIndex(0) as NSString;
        let path = documentsDirectory.stringByAppendingPathComponent("ToDoItems.plist");
        
        saveData.writeToFile(path, atomically: true);
    }
    
    func addNewToDoItem(toDoItem : ToDoItem) {
        self.toDoItems.append(toDoItem)
        self.save();
    }
    
    func removeElem(index : Int) {
        self.toDoItems.removeAtIndex(index)
        self.save()
    }
}
