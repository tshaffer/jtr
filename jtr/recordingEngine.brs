Function newRecordingEngine(jtr As Object) As Object

	RecordingEngine = {}

' setup methods
	RecordingEngine.Initialize					= re_Initialize

	RecordingEngine.jtr = jtr
	RecordingEngine.msgPort = jtr.msgPort

' setup methods
    RecordingEngine.EventHandler				= re_EventHandler
	RecordingEngine.HandleHttpEvent				= re_HandleHttpEvent

	RecordingEngine.StartManualRecord			= re_StartManualRecord
	RecordingEngine.EndManualRecord				= re_EndManualRecord
	RecordingEngine.StartHLSSegmentation		= re_StartHLSSegmentation
	RecordingEngine.HLSSegmentationComplete		= re_HLSSegmentationComplete

	return RecordingEngine

End Function


Sub re_Initialize()

	m.contentFolder = "content/"

'	m.scheduledRecordings = {}
'	m.recordingInProgressTimerId$ = ""

	m.mediaStreamer = CreateObject("roMediaStreamer")

End Sub


Sub re_EventHandler(event As Object)

	if type(event) = "roHtmlWidgetEvent" then

		m.HandleHttpEvent(event)
	
	else if type(event) = "roTimerEvent" then

		eventIdentity$ = stri(event.GetSourceIdentity())

		' recording timer
		if type(m.endRecordingTimer) = "roTimer" and stri(m.endRecordingTimer.GetIdentity()) = eventIdentity$ then

			m.EndManualRecord()

			m.recordingToSegment = m.jtr.GetDBRecordingByFileName(m.scheduledRecording.fileName$)

			' start HLS segmentation
			m.StartHLSSegmentation()

		endif

	else if type(event) = "roMediaStreamerEvent" then

		print "mediaStreamerEvent = ";event.GetEvent()

		m.HLSSegmentationComplete()

	endif

End Sub


Sub re_HandleHttpEvent(event)

	print "roHTMLWidgetEvent received in re_HandleHttpEvent"
	eventData = event.GetData()

	if type(eventData) = "roAssociativeArray" and type(eventData.reason) = "roString" then
        print "reason = " + eventData.reason
		if eventData.reason = "message" then
			aa = eventData.message
			if aa.command = "recordNow" then
				title$ = aa.title
				duration$ = aa.duration

				' capture recording parameters
				scheduledRecording = {}
				scheduledRecording.title$ = title$
				scheduledRecording.duration% = int(val(duration$))
				scheduledRecording.channel$ = "HDMI In"
				systemTime = CreateObject("roSystemTime")
				scheduledRecording.dateTime = systemTime.GetLocalDateTime()
				m.scheduledRecording = scheduledRecording

				' m.stateMachine.scheduledRecordings.AddReplace(scheduledRecording.timerId$, scheduledRecording)
				m.StartManualRecord()
				
			endif
		endif
	' don't understand the following
	else if eventData.reason = "message" then
		aa = eventData.message
		print "type(aa)=" + type(aa)		
		if type(aa.message) = "roString" then
			print "message from JS: ";aa.message		
		else if type(aa.command) = "roString" then
			command$ = aa.command
			if command$ = "recordNow" then
				stop
			endif
		endif
	endif

End Sub


Sub re_StartManualRecord()

	print "StartManualRecord " + m.scheduledRecording.title$ + " scheduled for " + m.scheduledRecording.dateTime.GetString()

	' tune channel
'	m.Tune(scheduledRecording.channel$)

	endDateTime = m.scheduledRecording.dateTime
	endDateTime.AddSeconds(m.scheduledRecording.duration% * 60)

	print "Manual record will end at " + endDateTime.GetString()

	m.endRecordingTimer = CreateObject("roTimer")
	m.endRecordingTimer.SetPort(m.msgPort)
	m.endRecordingTimer.SetDateTime(endDateTime)
	m.endRecordingTimer.Start()

'	m.stateMachine.recordingInProgressTimerId$ = scheduledRecording.timerId$

	' start recording
	m.scheduledRecording.fileName$ = Left(m.scheduledRecording.dateTime.ToIsoString(), 15)
	path$ = m.contentFolder + m.scheduledRecording.fileName$ + ".ts"

	if type(m.mediaStreamer) = "roMediaStreamer" then

		ok = m.mediaStreamer.SetPipeline("hdmi:,encoder:,file:///" + path$)
		if not ok then stop

		ok = m.mediaStreamer.Start()
		if not ok then stop

		' turn on record LED
		m.jtr.SetRecordLED(true)

	endif

End Sub


Sub re_EndManualRecord()

	print "EndManualRecord " + m.scheduledRecording.title$
	ok = m.mediaStreamer.Stop()
	if not ok then stop

	' Add or update record in database
	m.jtr.AddDBRecording(m.scheduledRecording)

	' Remove from list of pending records
'	ok = m.stateMachine.scheduledRecordings.Delete(scheduledRecordingTimerIdentity)
'	if not ok then stop

	' turn off record LED
	m.jtr.SetRecordLED(false)

	' TODO - turn on a different LED to indicate that segmentation is in progress

End Sub


Sub re_StartHLSSegmentation()

	m.recordingId% = m.recordingToSegment.RecordingId
	recording = m.jtr.GetDBRecording(stri(m.recordingId%))

	' create directory where hls segments will be generated
	dirName$ = "content/hls/" + m.recordingToSegment.FileName
	ok = CreateDirectory(dirName$)

	path$ = GetTSFilePath(m.recordingToSegment.FileName)

	' store segments in /content/hls/file name without extension/fileName
	pipeLineSpec$ = "file:///" + path$ + ", hls:///" + dirName$ + "/" + m.recordingToSegment.FileName + "?duration=10"

	m.mediaStreamer = CreateObject("roMediaStreamer")
	m.mediaStreamer.SetPort(m.msgPort)
	ok = m.mediaStreamer.SetPipeline(pipeLineSpec$)

	systemTime = CreateObject("roSystemTime")
	print "------- start segmentation at ";systemTime.GetLocalDateTime()

	ok = m.mediaStreamer.Start()

End Sub


Sub re_HLSSegmentationComplete()

	systemTime = CreateObject("roSystemTime")
	print "------- segmentation complete at ";systemTime.GetLocalDateTime()

	' update db to indicate that hls segments were created
	m.jtr.UpdateHLSSegmentationComplete(m.recordingId%)

	' determine whether or not the .ts file can be deleted
	okToDelete = m.jtr.tsDeletable(m.recordingId%)
	if okToDelete then
		tsPath$ = GetTSFilePath(m.recordingToSegment.FileName)
		if tsPath$ <> "" then
			ok = DeleteFile(tsPath$)
			if not ok print "Delete after transcode complete failed"
		endif
	endif

End Sub


Function oldNewRecordingEngine(jtr As Object) As Object

    RecordingEngine = newHSM()
    RecordingEngine.InitialPseudostateHandler = InitializeRecordingEngine

	RecordingEngine.jtr = jtr
	RecordingEngine.msgPort = jtr.msgPort

    RecordingEngine.stTop = RecordingEngine.newHState(RecordingEngine, "Top")
    RecordingEngine.stTop.HStateEventHandler = STTopEventHandler

    RecordingEngine.stRecordingController = RecordingEngine.newHState(RecordingEngine, "RecordingController")
    RecordingEngine.stRecordingController.HStateEventHandler = STRecordingControllerEventHandler
    RecordingEngine.stRecordingController.AddManualRecord = AddManualRecord
	RecordingEngine.stRecordingController.superState = RecordingEngine.stTop

    RecordingEngine.stIdle = RecordingEngine.newHState(RecordingEngine, "RecordingIdle")
    RecordingEngine.stIdle.HStateEventHandler = STRecordingIdleEventHandler
	RecordingEngine.stIdle.superState = RecordingEngine.stRecordingController

    RecordingEngine.stRecording = RecordingEngine.newHState(RecordingEngine, "Recording")
    RecordingEngine.stRecording.HStateEventHandler = STRecordingEventHandler
	RecordingEngine.stRecording.superState = RecordingEngine.stRecordingController
	RecordingEngine.stRecording.StartManualRecord = StartManualRecord
	RecordingEngine.stRecording.EndManualRecord	= EndManualRecord
	RecordingEngine.stRecording.Tune = Tune

    RecordingEngine.stSegmentingHLS = RecordingEngine.newHState(RecordingEngine, "SegmentingHLS")
    RecordingEngine.stSegmentingHLS.HStateEventHandler = STSegmentingHLSEventHandler
	RecordingEngine.stSegmentingHLS.superState = RecordingEngine.stRecordingController

	RecordingEngine.topState = RecordingEngine.stTop

	return RecordingEngine

End Function


Function InitializeRecordingEngine() As Object

	m.contentFolder = "content/"

	m.scheduledRecordings = {}
	m.recordingInProgressTimerId$ = ""

	m.mediaStreamer = CreateObject("roMediaStreamer")

	return m.stIdle

End Function


Function STRecordingControllerEventHandler(event As Object, stateData As Object) As Object

    stateData.nextState = invalid
    
    if type(event) = "roAssociativeArray" then      ' internal message event

        if IsString(event["EventType"]) then
        
            if event["EventType"] = "ENTRY_SIGNAL" then
            
                print m.id$ + ": entry signal"

                return "HANDLED"

            else if event["EventType"] = "EXIT_SIGNAL" then

                print m.id$ + ": exit signal"
            
            else if event["EventType"] = "ADD_MANUAL_RECORD" then

				m.AddManualRecord(event["Title"], event["Channel"], event["DateTime"], event["Duration"], event["UseTuner"])

				return "HANDLED"

			endif
            
        endif
        
    endif
            
    stateData.nextState = m.superState
    return "SUPER"
    
End Function



Function STRecordingIdleEventHandler(event As Object, stateData As Object) As Object

    stateData.nextState = invalid
    
    if type(event) = "roAssociativeArray" then      ' internal message event

        if IsString(event["EventType"]) then
        
            if event["EventType"] = "ENTRY_SIGNAL" then
            
                print m.id$ + ": entry signal"

                return "HANDLED"

            else if event["EventType"] = "EXIT_SIGNAL" then

                print m.id$ + ": exit signal"            
            
            else if event["EventType"] = "RECORD_NOW" then

				scheduledRecording = {}
				scheduledRecording.title$ = event["Title"]
				scheduledRecording.duration% = event["Duration"]
				scheduledRecording.channel$ = "HDMI In"

				systemTime = CreateObject("roSystemTime")
				scheduledRecording.dateTime = systemTime.GetLocalDateTime()

				' phony timer object
				scheduledRecording.timer = CreateObject("roTimer")
				scheduledRecording.timerId$ = stri(scheduledRecording.timer.GetIdentity())

				m.stateMachine.scheduledRecordings.AddReplace(scheduledRecording.timerId$, scheduledRecording)

				m.stateMachine.scheduledRecording = scheduledRecording
				stateData.nextState = m.stateMachine.stRecording
				return "TRANSITION"

			endif

        endif
        
	else if type(event) = "roTimerEvent" then

		eventIdentity$ = stri(event.GetSourceIdentity())

		' check for a scheduled recording
		for each scheduledRecordingTimerIdentity in m.stateMachine.scheduledRecordings
			if eventIdentity$ = scheduledRecordingTimerIdentity then
				m.stateMachine.scheduledRecording = m.stateMachine.scheduledRecordings[scheduledRecordingTimerIdentity]
				stateData.nextState = m.stateMachine.stRecording
				return "TRANSITION"
				exit for
			endif
		next

    endif
            
    stateData.nextState = m.superState
    return "SUPER"
    
End Function


Function STRecordingEventHandler(event As Object, stateData As Object) As Object

    stateData.nextState = invalid
    
    if type(event) = "roAssociativeArray" then      ' internal message event

        if IsString(event["EventType"]) then
        
            if event["EventType"] = "ENTRY_SIGNAL" then

                print m.id$ + ": entry signal"

				m.StartManualRecord(m.stateMachine.scheduledRecording)

                return "HANDLED"

            else if event["EventType"] = "EXIT_SIGNAL" then

                print m.id$ + ": exit signal"
            
			endif
            
        endif
        
	else if type(event) = "roTimerEvent" then

		eventIdentity$ = stri(event.GetSourceIdentity())

		' check for a recording in progress
		if type(m.endRecordingTimer) = "roTimer" and stri(m.endRecordingTimer.GetIdentity()) = eventIdentity$ then
			for each scheduledRecordingTimerIdentity in m.stateMachine.scheduledRecordings
				if scheduledRecordingTimerIdentity = m.stateMachine.recordingInProgressTimerId$ then
					scheduledRecording = m.stateMachine.scheduledRecordings[scheduledRecordingTimerIdentity]
					m.EndManualRecord(scheduledRecordingTimerIdentity, scheduledRecording)
					m.stateMachine.recordingToSegment = m.stateMachine.jtr.GetDBRecordingByFileName(scheduledRecording.fileName$)
					stateData.nextState = m.stateMachine.stSegmentingHLS
					return "TRANSITION"
				endif
			next
			return "HANDLED"
		endif

    endif
            
    stateData.nextState = m.superState
    return "SUPER"
    
End Function


Sub AddManualRecord(title$, channel$ As String, dateTime As Object, duration% As Integer, useTuner$ As String)

	print "Add scheduledRecording: " + title$ + " to begin at " + dateTime.GetString()

	timer = CreateObject("roTimer")
	timer.SetPort(m.stateMachine.msgPort)
	timer.SetDateTime(dateTime)

	scheduledRecording = {}
	scheduledRecording.timerId$ = stri(timer.GetIdentity())
	scheduledRecording.title$ = title$
	scheduledRecording.channel$ = channel$
	scheduledRecording.dateTime = dateTime
	scheduledRecording.duration% = duration%
	scheduledRecording.timer = timer

	timer.Start()

	m.stateMachine.scheduledRecordings.AddReplace(scheduledRecording.timerId$, scheduledRecording)

End Sub


Sub StartManualRecord(scheduledRecording As Object)

	print "StartManualRecord " + scheduledRecording.title$ + " scheduled for " + scheduledRecording.dateTime.GetString()

	' tune channel
'	m.Tune(scheduledRecording.channel$)

	endDateTime = scheduledRecording.dateTime
	endDateTime.AddSeconds(scheduledRecording.duration% * 60)

	print "Manual record will end at " + endDateTime.GetString()

	m.endRecordingTimer = CreateObject("roTimer")
	m.endRecordingTimer.SetPort(m.stateMachine.msgPort)
	m.endRecordingTimer.SetDateTime(endDateTime)
	m.endRecordingTimer.Start()

	m.stateMachine.recordingInProgressTimerId$ = scheduledRecording.timerId$

	' start recording
	scheduledRecording.fileName$ = Left(scheduledRecording.dateTime.ToIsoString(), 15)
	path$ = m.stateMachine.contentFolder + scheduledRecording.fileName$ + ".ts"

	if type(m.stateMachine.mediaStreamer) = "roMediaStreamer" then

		ok = m.stateMachine.mediaStreamer.SetPipeline("hdmi:,encoder:,file:///" + path$)
		if not ok then stop

		ok = m.stateMachine.mediaStreamer.Start()
		if not ok then stop

		' turn on record LED
		m.stateMachine.jtr.SetRecordLED(true)

	endif

End Sub


Sub Tune(channelName$)

	url$ = "http://192.168.2.23:8080/Tune?channelName=" + channelName$

	print "Tune using URL=";url$

	tunerUrl = CreateObject("roUrlTransfer")
	tunerUrl.SetUrl(url$)
	tunerUrl.SetTimeout(10000)

	' no need to set msgPort - no response required
	response$ = tunerUrl.GetToString()

	print "Tune response = ";response$

End Sub


Sub EndManualRecord(scheduledRecordingTimerIdentity As Object, scheduledRecording As Object)

	print "EndManualRecord " + scheduledRecording.title$
	ok = m.stateMachine.mediaStreamer.Stop()
	if not ok then stop

	' Add or update record in database
	m.stateMachine.jtr.AddDBRecording(scheduledRecording)

	' Remove from list of pending records
	ok = m.stateMachine.scheduledRecordings.Delete(scheduledRecordingTimerIdentity)
	if not ok then stop

	' turn off record LED
	m.stateMachine.jtr.SetRecordLED(false)

	' TODO - turn on a different LED to indicate that segmentation is in progress

End Sub


Function STSegmentingHLSEventHandler(event As Object, stateData As Object) As Object

    stateData.nextState = invalid
    
    if type(event) = "roAssociativeArray" then      ' internal message event

        if IsString(event["EventType"]) then
        
            if event["EventType"] = "ENTRY_SIGNAL" then
            
                print m.id$ + ": entry signal"

				m.recordingId% = m.stateMachine.recordingToSegment.RecordingId
				recording = m.stateMachine.jtr.GetDBRecording(stri(m.recordingId%))

				' create directory where hls segments will be generated
				dirName$ = "content/hls/" + m.stateMachine.recordingToSegment.FileName
				ok = CreateDirectory(dirName$)

				path$ = GetTSFilePath(m.stateMachine.recordingToSegment.FileName)

				' store segments in /content/hls/file name without extension/fileName
				pipeLineSpec$ = "file:///" + path$ + ", hls:///" + dirName$ + "/" + m.stateMachine.recordingToSegment.FileName + "?duration=10"

				m.mediaStreamer = CreateObject("roMediaStreamer")
				m.mediaStreamer.SetPort(m.stateMachine.msgPort)
				ok = m.mediaStreamer.SetPipeline(pipeLineSpec$)

				systemTime = CreateObject("roSystemTime")
				print "------- start segmentation at ";systemTime.GetLocalDateTime()

				ok = m.mediaStreamer.Start()

                return "HANDLED"

            else if event["EventType"] = "EXIT_SIGNAL" then

                print m.id$ + ": exit signal"
            
				return "HANDLED"

			endif
            
        endif
        
	else if type(event) = "roMediaStreamerEvent" then

		systemTime = CreateObject("roSystemTime")
		print "------- segmentation complete at ";systemTime.GetLocalDateTime()

		' update db to indicate that hls segments were created
		m.stateMachine.jtr.UpdateHLSSegmentationComplete(m.recordingId%)

		' determine whether or not the .ts file can be deleted
		okToDelete = m.stateMachine.jtr.tsDeletable(m.recordingId%)
		if okToDelete then
			tsPath$ = GetTSFilePath(m.stateMachine.recordingToSegment.FileName)
			if tsPath$ <> "" then
				ok = DeleteFile(tsPath$)
				if not ok print "Delete after transcode complete failed"
			endif
		endif

		print "mediaStreamerEvent = ";event.GetEvent()
		stateData.nextState = m.stateMachine.stIdle
		return "TRANSITION"

    endif
            
    stateData.nextState = m.superState
    return "SUPER"

End Function




