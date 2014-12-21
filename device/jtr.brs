Library "db.brs"
Library "server.brs"

Sub Main()

	RunJtr()

End Sub


Sub RunJtr()

    msgPort = CreateObject("roMessagePort")

    JTR = newJTR(msgPort)

	JTR.scheduledRecordings = {}
	JTR.recordingInProgressTimerId$ = ""

	JTR.InitializeServer()
	JTR.OpenDatabase()

	JTR.mediaStreamer = CreateObject("roMediaStreamer")
	' .SetPipeline("hdmi:,encoder:,file:///myfilename.ts")
	' .Start()

	JTR.videoPlayer = CreateObject("roVideoPlayer")
	JTR.videoPlayer.SetPort(msgPort)

    JTR.EventLoop()

End Sub


Function newJTR(msgPort As Object) As Object

    JTR = {}
    JTR.msgPort = msgPort

	JTR.EventLoop = EventLoop

	JTR.InitializeServer		= InitializeServer
	JTR.AddHandlers				= AddHandlers
	
	JTR.OpenDatabase			= OpenDatabase
	JTR.CreateDBTable			= CreateDBTable
	JTR.GetDBVersion			= GetDBVersion
	JTR.SetDBVersion			= SetDBVersion
	JTR.ExecuteDBInsert			= ExecuteDBInsert
	JTR.ExecuteDBSelect			= ExecuteDBSelect
	JTR.GetDBVersionCallback	= GetDBVersionCallback
	JTR.AddDBRecording			= AddDBRecording

	JTR.AddManualRecord			= AddManualRecord
	JTR.StartManualRecord		= StartManualRecord
	JTR.EndManualRecord			= EndManualRecord
	JTR.StartRecord				= StartRecord
	JTR.StopRecord				= StopRecord

	return JTR

End Function


Sub ListFiles(path$ As String, listOfFiles As Object)

	listOfFileEntries = ListDir(path$)
	for each fileEntry in listOfFileEntries
		childPath$ = path$ + "/" + fileEntry

		' this section of code is meant to determine if childPath$ is a directory or a file.
		' if there's a direct way to determine if this, it would eliminate this call to ListDir
		listOfChildEntries = ListDir(childPath$)
		if listOfChildEntries.Count() = 0 then
			listOfFiles.push(childPath$)
		else
			ListFiles(childPath$, listOfFiles)
		endif

	next

End Sub


Sub EventLoop()

	SQLITE_COMPLETE = 100

print "entering event loop"

    while true
        
        msg = wait(0, m.msgPort)

		print "msg received - type=" + type(msg)

		if type(msg) = "roHttpEvent" then
        
			userdata = msg.GetUserData()
			if type(userdata) = "roAssociativeArray" and type(userdata.HandleEvent) = "roFunction" then
				userData.HandleEvent(userData, msg)
			endif

		else if type(msg) = "roTimerEvent" then

			eventIdentity$ = stri(msg.GetSourceIdentity())

			' check for a scheduled recording
			for each scheduledRecordingTimerIdentity in m.scheduledRecordings
				if eventIdentity$ = scheduledRecordingTimerIdentity then
					scheduledRecording = m.scheduledRecordings[scheduledRecordingTimerIdentity]
					m.StartManualRecord(scheduledRecording)
					exit for
				endif
			next

			if type(m.endRecordingTimer) = "roTimer" and stri(m.endRecordingTimer.GetIdentity()) = eventIdentity$ then
				for each scheduledRecordingTimerIdentity in m.scheduledRecordings
					if scheduledRecordingTimerIdentity = m.recordingInProgressTimerId$ then
						scheduledRecording = m.scheduledRecordings[scheduledRecordingTimerIdentity]
						m.EndManualRecord(scheduledRecordingTimerIdentity, scheduledRecording)
						exit for
					endif
				next
			endif

			if type(m.recordingTimer) = "roTimer" and stri(m.recordingTimer.GetIdentity()) = eventIdentity$ then
				m.StopRecord()
			endif

		endif

    end while

End Sub


Sub AddManualRecord(title$, channel$ As String, dateTime As Object, duration% As Integer)

	print "Add scheduledRecording: " + title$

	m.scheduledRecordingTimer = CreateObject("roTimer")
	m.scheduledRecordingTimer.SetPort(m.msgPort)
	m.scheduledRecordingTimer.SetDateTime(dateTime)

	scheduledRecording = {}
	scheduledRecording.timerId$ = stri(m.scheduledRecordingTimer.GetIdentity())
	scheduledRecording.title$ = title$
	scheduledRecording.channel$ = channel$
	scheduledRecording.dateTime = dateTime
	scheduledRecording.duration% = duration%

	m.scheduledRecordingTimer.Start()

	m.scheduledRecordings.AddReplace(scheduledRecording.timerId$, scheduledRecording)

End Sub


Sub StartManualRecord(scheduledRecording As Object)

	print "StartManualRecord " + scheduledRecording.title$

	' tune channel

	endDateTime = scheduledRecording.dateTime
	endDateTime.AddSeconds(scheduledRecording.duration% * 60)

	print "Manual record will end at " + endDateTime.GetString()

	m.endRecordingTimer = CreateObject("roTimer")
	m.endRecordingTimer.SetPort(m.msgPort)
	m.endRecordingTimer.SetDateTime(endDateTime)
	m.endRecordingTimer.Start()

	m.recordingInProgressTimerId$ = scheduledRecording.timerId$

	' start recording
	scheduledRecording.path$ = Left(scheduledRecording.dateTime.ToIsoString(), 15) + ".ts"

End Sub


Sub EndManualRecord(scheduledRecordingTimerIdentity As Object, scheduledRecording As Object)

	print "EndManualRecord " + scheduledRecording.title$

	' Add or upate record in database
	m.AddDBRecording(scheduledRecording)

	' Remove from list of pending records
	ok = m.scheduledRecordings.Delete(scheduledRecordingTimerIdentity)
	if not ok then stop

End Sub


Sub StartRecord(fileName$ As String, duration% As Integer)

print "StartRecord: fileName="; fileName$; ", duration=";duration%

	if type(m.mediaStreamer) = "roMediaStreamer" then

'		ok = m.mediaStreamer.SetPipeline("hdmi:,encoder:,file:///myfilename.ts")
		ok = m.mediaStreamer.SetPipeline("hdmi:,encoder:,file:///" + fileName$)
		if not ok then stop

		ok = m.mediaStreamer.Start()
		if not ok then stop

        m.recordingTimer = CreateObject("roTimer")
        m.recordingTimer.SetPort(m.msgPort)
		m.recordingTimer.SetElapsed(duration%, 0)
        m.recordingTimer.Start()

	else
		stop
	endif

End Sub


Sub StopRecord()

print "StopRecord"

	ok = m.mediaStreamer.Stop()
	if not ok then stop

End Sub
