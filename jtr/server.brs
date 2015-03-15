Sub InitializeServer()

    m.localServer = CreateObject("roHttpServer", { port: 8080 })
    m.localServer.SetPort(m.msgPort)

	' commands sent from the browser or another app; commands get routed to device js for injection into the HSM framework
	m.browserCommandAA =				{ HandleEvent: browserCommand, mVar: m}
	m.localServer.AddGetFromEvent({ url_path: "/browserCommand", user_data: m.browserCommandAA })

	' PENDING - manual record as invoked on the device - not real now - manual record is only done from the browser
	m.manualRecordAA =					{ HandleEvent: manualRecord, mVar: m }
	m.localServer.AddGetFromEvent({ url_path: "/manualRecord", user_data: m.manualRecordAA })

	' RECORD NOW - removed

	' retrieve and return information about all recordings
	m.getRecordingsAA =					{ HandleEvent: getRecordings, mVar: m }
	m.localServer.AddGetFromEvent({ url_path: "/getRecordings", user_data: m.getRecordingsAA })

	' ????
	' retrieve information about a specific recording
	' USED?? - question posed to Joel
	' rename getRecording to something else
	m.recordingAA =						{ HandleEvent: getRecording, mVar: m }
	m.localServer.AddGetFromEvent({ url_path: "/recording", user_data: m.recordingAA })

	' part of file transcoding process
	m.fileToTranscodeAA =				{ HandleEvent: fileToTranscode, mVar: m }
	m.localServer.AddGetFromEvent({ url_path: "/fileToTranscode", user_data: m.fileToTranscodeAA })
	m.filePostedAA =					{ HandleEvent: filePosted, mVar: m }
	m.localServer.AddPostToFile({ url_path: "/TranscodedFile", destination_directory: GetDefaultDrive(), user_data: m.filePostedAA })

	' returns URL for HLS segment if it exists; 404 otherwise
	m.hlsUrlAA =						{ HandleEvent: hlsUrl, mVar: m }
	m.localServer.AddGetFromEvent({ url_path: "/hlsUrl", user_data: m.hlsUrlAA })

	' current state of the jtr app
	m.currentStateAA =					{ HandleEvent: currentJTRState, mVar: m }
	m.localServer.AddGetFromEvent({ url_path: "/currentState", user_data: m.currentStateAA })

	' get and set the last selected show; uses BS as this information is stored in the database (by storing it in the db rather than localStorage, the iOS app can use this functionality)
	m.getLastSelectedShowIdAA =			{ HandleEvent: getLastSelectedShowId, mVar: m }
	m.localServer.AddGetFromEvent({ url_path: "/lastSelectedShow", user_data: m.getLastSelectedShowIdAA })
	m.setLastSelectedShowIdAA =			{ HandleEvent: setLastSelectedShowId, mVar: m }
	m.localServer.AddPostToFormData({ url_path: "/lastSelectedShow", user_data: m.setLastSelectedShowIdAA })

	' !!
	'jump - not yet implemented in overhaul. unclear whether this will survive new architecture
	m.jumpAA =							{ HandleEvent: jumpCmd, mVar: m}
	m.localServer.AddGetFromEvent({ url_path: "/jump", user_data: m.jumpAA })

	' ????
	' why doesn't it use the message port interface? PostBSMessage
	' handlers for remote keys; invoked either from device or from browser

	m.pauseAA =							{ HandleEvent: pause, mVar: m}
	m.localServer.AddGetFromEvent({ url_path: "/pause", user_data: m.pauseAA })

	m.rewindAA =						{ HandleEvent: rewind, mVar: m}
	m.localServer.AddGetFromEvent({ url_path: "/rewind", user_data: m.rewindAA })

	m.nextRewindAA =					{ HandleEvent: nextRewind, mVar: m}
	m.localServer.AddGetFromEvent({ url_path: "/nextRewind", user_data: m.nextRewindAA })

	m.playAA =							{ HandleEvent: play, mVar: m}
	m.localServer.AddGetFromEvent({ url_path: "/play", user_data: m.playAA })

	m.fastForwardAA =					{ HandleEvent: fastForward, mVar: m}
	m.localServer.AddGetFromEvent({ url_path: "/fastForward", user_data: m.fastForwardAA })

	m.nextFastForwardAA =				{ HandleEvent: nextFastForward, mVar: m}
	m.localServer.AddGetFromEvent({ url_path: "/nextFastForward", user_data: m.nextFastForwardAA })

	m.instantReplayAA =					{ HandleEvent: instantReplay, mVar: m}
	m.localServer.AddGetFromEvent({ url_path: "/instantReplay", user_data: m.instantReplayAA })

	m.quickSkipAA =						{ HandleEvent: quickSkip, mVar: m}
	m.localServer.AddGetFromEvent({ url_path: "/quickSkip", user_data: m.quickSkipAA })

' incorporation of site downloader code
    m.siteFilePostedAA = { HandleEvent: siteFilePosted, mVar: m }
    m.localServer.AddPostToFile({ url_path: "/UploadFile", destination_directory: GetDefaultDrive(), user_data: m.siteFilePostedAA })

    m.getFilesToTransferAA =  { HandleEvent: getFilesToTransfer, mVar: m }
    m.localServer.AddPostToFile({ url_path: "/GetFilesToTransfer", destination_directory: GetDefaultDrive(), user_data: m.getFilesToTransferAA })

    m.restartScriptAA = { HandleEvent: restartScript, mVar: m }
    m.localServer.AddGetFromEvent({ url_path: "/ExitScript", user_data: m.restartScriptAA })

' Bonjour advertisement
'    service = { name: "JTR Web Service", type: "_http._tcp", port: 8080, _functionality: BSP.lwsConfig$, _serialNumber: sysInfo.deviceUniqueID$, _unitName: unitName$, _unitNamingMethod: unitNamingMethod$,  }
'    JTR.advert = CreateObject("roNetworkAdvertisement", service)

	serverDirectory$ = "webSite"
	listOfServerFiles = []
	ListFiles(serverDirectory$, listOfServerFiles)
	m.AddHandlers(serverDirectory$, listOfServerFiles)

End Sub


Sub AddHandlers(serverDirectory$ As String, listOfHandlers As Object)

	' first filePath = webSite/remote-snapshot/angular.min.js
	' parts = webSite/remote-snapshot/angular.min.js
	' serverDirectory$ = webSite

	for each filePath in listOfHandlers

		ext = GetFileExtension(filePath)
		if ext <> invalid then

			contentType$ = GetMimeTypeByExtension(ext)
	
			url$ = Right(filePath, len(filePath) - len(serverDirectory$))

			m.localServer.AddGetFromFile({ url_path: url$, filename: filePath, content_type: contentType$ })

			if url$ = "/index.html" then
				m.localServer.AddGetFromFile({ url_path: "/", filename: filePath, content_type: contentType$ })
			endif

		endif

	next

End Sub


' endpoint invoked when browserCommand is invoked from a browser or external app
Sub browserCommand(userData as Object, e as Object)

	print "browserCommand endpoint invoked - post message to javascript"

    mVar = userData.mVar

	message = e.GetRequestParams()

'	relay the message to js
	ok = mVar.htmlWidget.PostJSMessage(message)

    e.AddResponseHeader("Content-type", "text/plain")
    e.SetResponseBodyString("ok")
    e.SendResponse(200)

End Sub


' endpoint invoked when the user wants to playback a specific recording - playback resumes from where it left off
Sub getRecording(userData as Object, e as Object)

	print "recording endpoint invoked"

    mVar = userData.mVar

	requestParams = e.GetRequestParams()

	recordingId = requestParams["recordingId"]
	print "getRecording::play recording ";recordingId

	recording = mVar.GetDBRecording(recordingId)

	StartPlayback(recording)

    e.AddResponseHeader("Content-type", "text/plain")
    e.SetResponseBodyString("ok")
    e.SendResponse(200)

End Sub


Sub getRecordings(userData as Object, e as Object)

	print "getRecordings endpoint invoked"

    mVar = userData.mVar

	response = {}

	' get remaining space on card
	storageInfo = CreateObject("roStorageInfo", "SD:")
	freeSpace = StripLeadingSpaces(stri(storageInfo.GetFreeInMegabytes()))
	response.freeSpace = freeSpace

	PopulateRecordings(mVar, response)

	json = FormatJson(response, 0)

    e.AddResponseHeader("Content-type", "text/json")
    e.SetResponseBodyString(json)
    e.SendResponse(200)

End Sub


Sub PopulateRecordings(mVar As Object, response As Object)

	jtrRecordings = mVar.GetDBRecordings()

	response.recordings = []

	for each recording in jtrRecordings
		
		' only include the entry if the file actually exists
		readFile = CreateObject("roReadFile", recording.Path)
		if type(readFile) = "roReadFile" then
			response.recordings.push(recording)
		else
			print "recording " + recording.Title + " not found at " + recording.Path + ". Id = " + stri(recording.RecordingId)
		endif
	next

End Sub


Sub manualRecord(userData as Object, e as Object)

	print "Manual Record invoked"

    mVar = userData.mVar

	requestParams = e.GetRequestParams()

	title$ = requestParams["title"]
	duration% = int(val(requestParams["duration"]))
	channel$ = requestParams["channel"]
	useTuner$ = requestParams["useTuner"]	' true or false

	dateTime = CreateObject("roDateTime")
	dateTime.FromIsoString(requestParams["bsIsoDateTime"])

	addManualRecordMessage = CreateObject("roAssociativeArray")
	addManualRecordMessage["EventType"] = "ADD_MANUAL_RECORD"
	addManualRecordMessage["Title"] = title$
	addManualRecordMessage["Channel"] = channel$
	addManualRecordMessage["DateTime"] = dateTime
	addManualRecordMessage["Duration"] = duration%
	addManualRecordMessage["UseTuner"] = useTuner$
	mVar.msgPort.PostMessage(addManualRecordMessage)

    e.AddResponseHeader("Content-type", "text/plain")
    e.SetResponseBodyString("herro Joel")
    e.SendResponse(200)

End Sub


Sub hlsUrl(userData as Object, e as Object)

	print "hlsUrl endpoint invoked"

    mVar = userData.mVar
	requestParams = e.GetRequestParams()

	recordingId = requestParams["recordingId"]
	print "hlsUrl invoked on recording id = ";recordingId

	recording = mVar.GetDBRecording(recordingId)

	' TODO - return 404 if recording not found? something else if no HLS?

	if recording.HLSSegmentationComplete = 0 then
		' HLS segments don't exist
		e.AddResponseHeader("Content-type", "text/plain; charset=utf-8")
		e.SetResponseBodyString("Recording not found.")
	    e.SendResponse(404)
	else
		response = {}
		response.hlsUrl = "/content/hls/" + recording.FileName + "/" + recording.FileName + "_index.m3u8"
		json = FormatJson(response, 0)
		e.AddResponseHeader("Content-type", "text/json")
		e.SetResponseBodyString(json)
		e.SendResponse(200)
	endif

End Sub


Sub currentJTRState(userData as Object, e as Object)

	print "currentState endpoint invoked"

    mVar = userData.mVar

	response = {}
	response.currentState = mVar.GetCurrentState()
	json = FormatJson(response, 0)
	e.AddResponseHeader("Content-type", "text/json")
	e.SetResponseBodyString(json)
	e.SendResponse(200)

End Sub


Sub fileToTranscode(userData as Object, e as Object)

	print "fileToTranscode endpoint invoked"

    mVar = userData.mVar

    root = CreateObject("roXMLElement")
    root.SetName("BrightSignFileToTranscode")

	fileToTranscodeRecord = mVar.GetDBFileToTranscode()

	if type(fileToTranscodeRecord) = "roAssociativeArray" then

		' setup handler so this file can be retrieved
		print "fileToTranscode: add endpoint " + "/" + fileToTranscodeRecord.path
		mVar.localServer.AddGetFromFile({ url_path: "/" + fileToTranscodeRecord.path, filename: fileToTranscodeRecord.path, content_type: "video/mpeg"})

		' information to return: id, path
		fileToTranscodeElem = root.AddElement("FileToTranscode")

		idElem = fileToTranscodeElem.AddElement("id")
		idElem.SetBody(stri(fileToTranscodeRecord.RecordingId))

		pathElem = fileToTranscodeElem.AddElement("path")
		pathElem.SetBody(fileToTranscodeRecord.path)

	    xml = root.GenXML({ indent: " ", newline: chr(10), header: true })

		e.AddResponseHeader("Content-type", "text/xml")
		e.SetResponseBodyString(xml)
		e.SendResponse(200)
	else
		e.AddResponseHeader("Content-type", "text/plain; charset=utf-8")
		e.SetResponseBodyString("No file to transcode.")
		e.SendResponse(404)
	endif


End Sub


Sub filePosted(userData as Object, e as Object)

    mVar = userData.mVar

    print "respond to filePosted request"

	destinationFilename = e.GetRequestHeader("Destination-Filename")
	MoveFile(e.GetRequestBodyFile(), destinationFilename)

	' update the database to indicate that this file has been transcoded
	dbId = int(val(e.GetRequestHeader("DB-Id")))
	mVar.UpdateDBTranscodeComplete(dbId)

	recording = mVar.GetDBRecording(stri(dbId))
	tsPath$ = GetTSFilePath(recording.FileName)
	print "Transcode operation complete - delete ";tsPath$

	okToDelete = mVar.tsDeletable(dbId)
	if okToDelete then
		ok = DeleteFile(tsPath$)
		if not ok print "Delete after transcode complete failed"
	endif

	e.SetResponseBodyString("RECEIVED")
    e.SendResponse(200)

End Sub


' sends remote command to event handlers on device
Sub postRemoteMessage(userData As Object, e as Object, remoteMessage$ As String)

	print remoteMessage$ + " endpoint invoked"

    mVar = userData.mVar

	message = CreateObject("roAssociativeArray")
	message["command"] = remoteMessage$
	mVar.msgPort.PostMessage(message)

    e.AddResponseHeader("Content-type", "text/plain")
    e.SetResponseBodyString("ok")
    e.SendResponse(200)

End Sub


Sub recordedShows(userData as Object, e as Object)
	postRemoteMessage(userData, e, "RECORDED_SHOWS")
End Sub


Sub jumpCmd(userData as Object, e as Object)
	postRemoteMessage(userData, e, "JUMP")
End Sub


Sub pause(userData as Object, e as Object)
	postRemoteMessage(userData, e, "PAUSE")
End Sub


Sub rewind(userData as Object, e as Object)
	postRemoteMessage(userData, e, "REWIND")
End Sub


Sub nextRewind(userData as Object, e as Object)
	postRemoteMessage(userData, e, "NEXT_REWIND")
End Sub


Sub play(userData as Object, e as Object)
	postRemoteMessage(userData, e, "PLAY")
End Sub


Sub fastForward(userData as Object, e as Object)
	postRemoteMessage(userData, e, "FASTFORWARD")
End Sub


Sub nextFastForward(userData as Object, e as Object)
	postRemoteMessage(userData, e, "NEXT_FASTFORWARD")
End Sub


Sub instantReplay(userData as Object, e as Object)
	postRemoteMessage(userData, e, "INSTANT_REPLAY")
End Sub


Sub quickSkip(userData as Object, e as Object)
	postRemoteMessage(userData, e, "QUICK_SKIP")
End Sub


Sub getLastSelectedShowId(userData as Object, e as Object)

	print "getLastSelectedShowId endpoint invoked"

    mVar = userData.mVar

	response = {}
	response.lastSelectedShowId = mVar.GetDBLastSelectedShowId()
	json = FormatJson(response, 0)
	e.AddResponseHeader("Content-type", "text/json")
	e.SetResponseBodyString(json)
	e.SendResponse(200)

End Sub


Sub setLastSelectedShowId(userData as Object, e as Object)

	print "setLastSelectedShowId endpoint invoked"

    mVar = userData.mVar

	args = e.GetFormData()

	mVar.SetDBLastSelectedShowId(args.lastSelectedShowId)

	e.SetResponseBodyString("OK")
	e.SendResponse(200)


End Sub


Function GetFileExtension(file as String) as Object
  s=file.tokenize(".")
  if s.Count()>1
    ext=s.pop()
    return ext
  end if
  return invalid
end Function


Function GetMimeTypeByExtension(ext as String) as String

  ' start with audio types '
  if ext="mp3"
    return "audio/mpeg"
  else if ext="ogg"
	return "audio/ogg"

  ' now image types '
  else if ext="gif"
    return "image/gif"
  else if ext="jpeg"
    return "image/jpeg"
  else if ext="jpg"
    return "image/jpeg"
  else if ext="png"
    return "image/png"
  else if ext="svg"
    return "image/svg+xml"

  ' now text types'
  else if ext="css"
    return "text/css"
  else if ext="js"
    return "application/JavaScript"
  else if ext="csv"
    return "text/csv"
  else if ext="html"
    return "text/html"
  else if ext="htm"
    return "text/html"
  else if ext="txt"
    return "text/plain"
  else if ext="xml"
    return "text/xml"

  ' now some video types'
  else if ext="mpeg"
    return "video/mpeg"
  else if ext="mp4"
    return "video/mp4"
  else if ext="ts"
    return "video/mpeg"
  else if ext="mov"
	return "video/quicktime"
  else if ext="mkv"
	return "video/x-matroska"
  end if
  return ""
end Function


' Site downloader functionality - allows downloading of updated source while jtr is running.
Sub restartScript(userData as Object, e as Object)

    print "respond to ExitScript request"
    
    e.SetResponseBodyString("RECEIVED")
    e.SendResponse(200)

    print "restart the program"
    RestartScript()
        
End Sub


Function getFilesToTransfer(userData as Object, e as Object)

    mVar = userData.mVar
    
    print "respond to GetFilesToTransfer request"

    MoveFile(e.GetRequestBodyFile(), "filesInSite.xml")
    
	filesToTransfer = GetDifferentOrMissingFiles()

	xml = PopulateFilesToTransfer(filesToTransfer)

	if xml = invalid then
		e.SendResponse(404)
	else
		e.SetResponseBodyString(xml)
		e.SendResponse(200)
	endif

End Function


Function GetDifferentOrMissingFiles() As Object

    filesInSite$ = ReadAsciiFile("filesInSite.xml")
    if filesInSite$ = "" then stop

    filesInSiteXML = CreateObject("roXMLElement")
    filesInSiteXML.Parse(filesInSite$)

    filesToTransfer = []
    
    for each fileXML in filesInSiteXML.file

		fileInSite = {}
		fileInSite.fileName = fileXML.fileName.GetText()
		fileInSite.filePath = fileXML.filePath.GetText()
		fileInSite.hashValue = fileXML.hashValue.GetText()
		fileInSite.fileSize% = int(val(fileXML.fileSize.GetText()))

		fileOnCardIdentical = false

		file = CreateObject("roReadFile", fileInSite.filePath)
		if type(file) = "roReadFile" then
			file.SeekToEnd()
			size% = file.CurrentPosition()
			if size% > 0 then
				' file exists on card and is non zero size - see if it is the same file
				if size% = fileInSite.fileSize% then

					' size is identical, check sha1
'					fileInSiteContents$ = ReadAsciiFile(fileInSite.filePath)
'					hashGen = CreateObject("roHashGenerator", "SHA1")
'					sha1 = hashGen.hash(fileInSiteContents$).ToHexString()
					sha1 = GetSHA1(fileInSite.filePath)

					if lcase(sha1) = lcase(fileInSite.hashValue) then
						' sha1 is identical - files are the same
						fileOnCardIdentical = true
					else
'						stop
					endif

				else
'					stop
				endif
			else
'				stop
			endif
		else
'			stop
		endif

		' if the file is not on the card or is different, add it to the list of files that need to be downloaded
		if not fileOnCardIdentical then
			filesToTransfer.push(fileInSite)
		endif
	next

	return filesToTransfer

End Function


Function GetSHA1(path As String) As String

	ba = CreateObject("roByteArray")
	ok = ba.ReadFile(path)
	hashGen = CreateObject("roHashGenerator", "SHA1")
	return hashGen.hash(ba).ToHexString()

End Function


Function PopulateFilesToTransfer(filesToTransfer As Object)

	xml = invalid

	if filesToTransfer.Count() > 0 then

        root = CreateObject("roXMLElement")
        
        root.SetName("filesToTransfer")

		for each fileToTransfer in filesToTransfer

            item = root.AddBodyElement()
            item.SetName("file")

            elem = item.AddElement("fileName")
            elem.SetBody(fileToTransfer.fileName)
        
            elem = item.AddElement("filePath")
            elem.SetBody(fileToTransfer.filePath)
        
            elem = item.AddElement("hashValue")
            elem.SetBody(fileToTransfer.hashValue)
        
            elem = item.AddElement("fileSize")
            elem.SetBody(stri(fileToTransfer.fileSize%))
		next

		xml = root.GenXML({ header: true })

    endif

	return xml

End Function


Sub siteFilePosted(userData as Object, e as Object)

    mVar = userData.mVar

	destinationFilename = e.GetRequestHeader("Destination-Filename")
    print "FilePosted to ";destinationFileName
	ok = MoveFile(e.GetRequestBodyFile(), destinationFilename)
	if not ok then
		regex = CreateObject("roRegEx","\\","i")
		parts = regex.Split(destinationFilename)
		if parts.Count() > 1 then
			dirName$ = ""
			for i% = 0 to (parts.Count() - 2)
				dirName$ = dirName$ + parts[i%] + "\"

				' check to see if directory already exits
				dir = CreateObject("roReadFile", dirName$)
				if type(dir) <> "roReadFile" then
					ok = CreateDirectory(dirName$)
					if not ok then
						stop
					endif
				endif
			next

			' directories have been created - try again
			ok = MoveFile(e.GetRequestBodyFile(), destinationFilename)

		endif
	endif

	if not ok then
		stop
	endif

	e.SetResponseBodyString("RECEIVED")
    e.SendResponse(200)

End Sub
