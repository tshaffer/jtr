Library "utils.brs"
Library "logging.brs"
Library "remote.brs"
Library "db.brs"
Library "server.brs"
Library "hsm.brs"
Library "eventHandler.brs"
Library "recordingEngine.brs"
Library "displayEngine.brs"


REM Update whenever any of the scripts change
Function GetScriptVersion() As String
	return "0.0.1"
End Function   


Sub Main()
	RunJtr()
End Sub


Sub RunJtr()

    msgPort = CreateObject("roMessagePort")

	' for BigScreen TV
	videoMode = CreateObject("roVideoMode")
	videoMode.SetMode("1920x1080x60i")
	videoMode = invalid

	CreateDirectory("brightsign-dumps")
	CreateDirectory("content")
	CreateDirectory("/content/hls")

    JTR = newJTR(msgPort)

	JTR.logging.InitializeLogging()
'    JTR.logging.WriteDiagnosticLogEntry(diagnosticCodes.EVENT_STARTUP, Player.sysInfo.deviceFWVersion$ + chr(9) + Player.sysInfo.scriptVersion$)
    JTR.logging.WriteDiagnosticLogEntry("0", "5.2.5" + chr(9) + "0.0.1")

	EnableZoneSupport(true)

	JTR.eventHandler = newEventHandler(JTR)
	JTR.recordingEngine = newRecordingEngine(JTR)
	JTR.displayEngine = newDisplayEngine(JTR)

	JTR.InitializeServer()
	JTR.OpenDatabase()

	JTR.gpio = CreateObject("roGpioControlPort")

	useIRRemote = true

'	if useIRRemote then
'		JTR.remote = CreateObject("roIRRemote")
'		if type(JTR.remote) = "roIRRemote" then
'			JTR.remote.SetPort(msgPort)
'		else
''			TODO -if no IR Receiver, log it
'		endif
'	else
'		aa = {}
''		aa.source = "Iguana"
''		aa.encodings = ["NEC","RC5"]
'		aa.source = "IR-in"
'		aa.encodings = ["NEC"]
'		JTR.irReceiver = CreateObject("roIRReceiver", aa)
'		if type(JTR.irReceiver) = "roIRReceiver" then
'			JTR.irReceiver.SetPort(msgPort)
'		else
''			TODO - if no IR Receiver, log it
'		endif
'	endif

'	JTR.recordingEngine.Initialize()
'	JTR.displayEngine.Initialize()

'	JTR.eventHandler.AddHSM(JTR.recordingEngine)
'	JTR.eventHandler.AddHSM(JTR.displayEngine)

	JTR.videoPlayer = CreateObject("roVideoPlayer")
	JTR.videoPlayer.SetPort(msgPort)
    JTR.videoPlayer.SetLoopMode(0)

	JTR.InitializeHTML()

	globalAA = GetGlobalAA()
	globalAA.JTR = JTR
	globalAA.msgPort = msgPort
	globalAA.htmlWidget = JTR.htmlWidget

	' create and start a media server
	JTR.mediaServer = CreateObject("roMediaServer")
	ok = JTR.mediaServer.Start("http:port=8088:trace")

	JTR.currentState = {}
	JTR.currentState.state = "idle"

	JTR.eventHandler.EventLoop()

End Sub


Function newJTR(msgPort As Object) As Object

    JTR = {}
    JTR.msgPort = msgPort

	JTR.InitializeServer				= InitializeServer
	JTR.AddHandlers						= AddHandlers
	
	JTR.InitializeHTML					= InitializeHTML

	JTR.OpenDatabase					= OpenDatabase
	JTR.CreateDBTable					= CreateDBTable
	JTR.GetDBVersion					= GetDBVersion
	JTR.SetDBVersion					= SetDBVersion
	JTR.ExecuteDBInsert					= ExecuteDBInsert
	JTR.ExecuteDBSelect					= ExecuteDBSelect
	JTR.AddDBRecording					= AddDBRecording
	JTR.DeleteDBRecording				= DeleteDBRecording
	JTR.GetDBLastSelectedShowId			= GetDBLastSelectedShowId
	JTR.SetDBLastSelectedShowId			= SetDBLastSelectedShowId
	JTR.GetDBRecording					= GetDBRecording
	JTR.GetDBRecordingByFileName		= GetDBRecordingByFileName
	JTR.GetDBRecordings					= GetDBRecordings
	JTR.GetDBFileToTranscode			= GetDBFileToTranscode
	JTR.UpdateDBTranscodeComplete		= UpdateDBTranscodeComplete
	JTR.UpdateDBLastViewedPosition		= UpdateDBLastViewedPosition
	JTR.UpdateHLSSegmentationComplete	= UpdateHLSSegmentationComplete
	
	JTR.tsDeletable						= tsDeletable

	JTR.GetCurrentState					= GetCurrentState
	JTR.SetCurrentState					= SetCurrentState

	JTR.SetRecordLED					= SetRecordLED

    JTR.newLogging						= newLogging
    JTR.logging = JTR.newLogging()
		
	return JTR

End Function


Sub SetRecordLED(ledOn As Boolean)

	m.gpio.SetOutputState(9, ledOn)

End Sub


Function GetCurrentState()

	return m.currentState

End Function


Sub SetCurrentState(newState As Object)

	m.currentState = newState

End Sub


Sub ListFiles(path$ As String, listOfFiles As Object)

	listOfFileEntries = ListDir(path$)
	for each fileEntry in listOfFileEntries

		filePath$ = path$ + "/" + fileEntry
		dirPath$ = filePath$ + "/"

		dir = CreateObject("roReadFile", dirPath$)
		if type(dir) = "roReadFile" then
			ListFiles(filePath$, listOfFiles)
		else
			listOfFiles.push(filePath$)
		endif
	next

End Sub


Sub InitializeHTML()

	print "InitializeHTML invoked"

	' don't want cursor for now
    m.t=createobject("roTouchScreen")
    m.t.enablecursor(false)

	r = CreateObject("roRectangle", 0, 0, 1920, 1080)

	m.htmlWidget = CreateObject("roHtmlWidget", r)
	m.htmlWidget.SetPort(m.msgPort)
	m.htmlWidget.EnableMouseEvents(true)
	m.htmlWidget.SetHWZDefault("on")
	m.htmlWidget.EnableJavascript(true)
	m.htmlWidget.AllowJavaScriptUrls({ all: "*" })
	m.htmlWidget.StartInspectorServer(2999)
	m.htmlWidget.SetLocalStorageDir("localstorage")
	m.htmlWidget.SetLocalStorageQuota(1 * 1024 * 1024)

	m.htmlWidget.SetUrl("file:///webSite/index.html")

' TODO - modify HTML/javascript so that only a transparent background is shown initially
	m.htmlWidget.Show()

End Sub


Sub HandleHttpEvent(event)

	print "roHTMLWidgetEvent received in HandleHttpEvent"
	eventData = event.GetData()
	if type(eventData) = "roAssociativeArray" and type(eventData.reason) = "roString" then
        print "reason = " + eventData.reason
		if eventData.reason = "load-started" then
		else if eventData.reason = "load-finished" then

' send device's IP address to site's javascript
			' get ip address
			nc = CreateObject("roNetworkConfiguration", 0)
			networkConfig = nc.GetCurrentConfig()
			ipAddress$ = networkConfig.ip4_address
			print "ipAddress = ";ipAddress$

			' send it via message port
			aa = {}
			aa.AddReplace("ipAddress", ipAddress$)

			globalAA = GetGlobalAA()
			globalAA.htmlWidget.PostJSMessage(aa)

		else if eventData.reason = "load-error" then

		else if eventData.reason = "message" then
			print "message from javascript: " + eventData.message.message
		endif
	endif

End Sub


Sub StartPlayback(recording As Object)

	JTR = GetGlobalAA().JTR

	' send message to js to exit UI - necessary if command comes from browser
'	aa = {}
'	aa.AddReplace("bsMessage", "exitUI")
'	m.stateMachine.htmlWidget.PostJSMessage(aa)

	' if there's a current recording, save it for later possible jump
'	m.stateMachine.priorSelectedRecording = m.stateMachine.selectedRecording

	JTR.selectedRecording = recording
'   m.stateMachine.currentVideoPosition% = 0 - do this when executing 'play from beginning'
	JTR.currentVideoPosition% = recording.LastViewedPosition

	' new approach - launch video playback here
	print "LaunchVideo from StartPlayback"

	ok = JTR.videoPlayer.PlayFile(JTR.selectedRecording.Path)
	if not ok stop
		
'	m.stateMachine.UpdateProgressBar()
'	m.stateMachine.SeekToCurrentVideoPosition()

'	m.stateMachine.StartVideoPlaybackTimer()

End Sub
