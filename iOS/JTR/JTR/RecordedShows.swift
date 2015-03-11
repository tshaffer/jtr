//
//  RecordedShows.swift
//  JTR
//
//  Created by Classroom Tech User on 2/15/15.
//  Copyright (c) 2015 Classroom Tech User. All rights reserved.
//

import Foundation
import UIKit

class RecordedShow {
    var title = ""
    var fullDate = ""
    var dateRecorded = ""
    var position = ""
    var recordingId = ""
    var transcodeComplete = ""
    var duration = ""
    var time = ""
    var img : UIImage? = nil
}

class RecordedShows {
    var recordedShows : [RecordedShow] = []
}