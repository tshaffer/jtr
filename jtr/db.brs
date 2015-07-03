Sub OpenDatabase()

	m.dbSchemaVersion$ = "1.0"

	m.db = CreateObject("roSqliteDatabase")
	m.db.SetPort(m.msgPort)

	ok = m.db.Open("jtr.db")
	if ok then
		version$ = m.GetDBVersion()
		if version$ <> m.dbSchemaVersion$ then stop
	else
		ok = m.db.Create("jtr.db")
		if not ok then stop

		m.CreateDBTable("CREATE TABLE SchemaVersion (Version TEXT);")

		m.SetDBVersion(m.dbSchemaVersion$)

		m.CreateDBTable("CREATE TABLE Recordings (RecordingId INTEGER PRIMARY KEY AUTOINCREMENT, Title TEXT, StartDateTime TEXT, Duration INT, FileName TEXT, LastViewedPosition INT, TranscodeComplete INT, HLSSegmentationComplete INT, HLSUrl TEXT);")

		m.CreateDBTable("CREATE TABLE ScheduledRecordings (Id INTEGER PRIMARY KEY AUTOINCREMENT, DateTime INT, Title TEXT, Duration INT, InputSource TEXT, Channel TEXT, RecordingBitRate INT, SegmentRecording INT);")

		m.CreateDBTable("CREATE TABLE Settings (RecordingBitRate INT, SegmentRecordings INT);")

		m.CreateDBTable("CREATE TABLE LastSelectedShow (Id TEXT);")

		m.CreateDBTable("CREATE TABLE LastTunedChannel (Channel TEXT);")

		m.CreateDBTable("CREATE TABLE Stations (Atsc TEXT PRIMARY KEY, CommonName TEXT, Name TEXT, StationId TEXT, CallSign TEXT);")
		m.PopulateStationsTable()

		m.CreateDBTable("CREATE TABLE StationSchedulesForSingleDay (StationId TEXT, ScheduleDate TEXT, ModifiedDate TEXT, MD5 TEXT, PRIMARY KEY (StationId, ScheduleDate));")

		m.CreateDBTable("CREATE TABLE ProgramsForStations (StationId TEXT, ScheduleDate TEXT, ProgramId TEXT, AirDateTime TEXT, Duration TEXT, MD5 TEXT);")
	
		m.CreateDBTable("CREATE TABLE Programs (ProgramId TEXT, Title TEXT, Description TEXT);")

		m.CreateDBTable("CREATE TABLE ProgramCast (ProgramId TEXT, Name TEXT, BillingOrder TEXT);")

	endif

End Sub


Sub CreateDBTable(statement$ As String)

	SQLITE_COMPLETE = 100

	createStmt = m.db.CreateStatement(statement$)

	if type(createStmt) <> "roSqliteStatement" then
        print "CreateStatement failure - " + statement$ : stop
	endif

	sqlResult = createStmt.Run()

	if sqlResult <> SQLITE_COMPLETE
        print "sqlResult <> SQLITE_COMPLETE" : stop
	endif

	createStmt.Finalise()

End Sub


Sub ExecuteDBInsert(insert$ As String, params As Object)
	
	SQLITE_COMPLETE = 100

	insertStatement = m.db.CreateStatement(insert$)

	if type(insertStatement) <> "roSqliteStatement" then
        print "CreateStatement failure - " + insert$ : stop
	endif

	if type(params) = "roArray" then
		bindResult = insertStatement.BindByOffset(params)
	else
		bindResult = insertStatement.BindByName(params)
	endif

	if not bindResult then
        print "Bind failure" : stop
	endif

	sqlResult = insertStatement.Run()

	if sqlResult <> SQLITE_COMPLETE
        print "sqlResult <> SQLITE_COMPLETE" : stop
	endif

	insertStatement.Finalise()

End Sub


Sub ExecuteDBSelect(select$ As String, resultsCallback As Object, selectData As Object, params As Object)

	SQLITE_ROWS = 102

	selectStmt = m.db.CreateStatement(select$)

	if type(selectStmt) <> "roSqliteStatement" then
        print "CreateStatement failure - " + select$ : stop
	endif

	bindResult = true
	if type(params) = "roArray" then
		bindResult = selectStmt.BindByOffset(params)
	else if type(params) = "roAssociativeArray" then
		bindResult = selectStmt.BindByName(params)
	endif

	if not bindResult then
        print "Bind failure" : stop
	endif

	sqlResult = selectStmt.Run()

	while sqlResult = SQLITE_ROWS

		resultsData = selectStmt.GetData()
	
		resultsCallback(resultsData, selectData)

		sqlResult = selectStmt.Run() 
		   
	end while

	selectStmt.Finalise()

End Sub


Sub SetDBVersion(version$ As String)

	insertSQL$ = "INSERT INTO SchemaVersion (Version) VALUES(:version_param);"

	params = { version_param: version$ }

	m.ExecuteDBInsert(insertSQL$, params)

End Sub


Sub GetDBVersionCallback(resultsData As Object, selectData As Object)

	selectData.version$ = resultsData["Version"]

End Sub


Function GetDBVersion() As String

	selectData = {}
	selectData.version$ = ""

	select$ = "SELECT SchemaVersion.Version FROM SchemaVersion;"
	m.ExecuteDBSelect(select$, GetDBVersionCallback, selectData, invalid)

	return selectData.version$

End Function


Sub GetLastScheduledRecordingIdCallback(resultsData As Object, selectData As Object)

	selectData.id = resultsData["MaxId"]

End Sub


Function GetLastScheduledRecordingId() As Integer

	selectData = {}

	select$ = "SELECT MAX (Id) as MaxId FROM ScheduledRecordings;"
	m.ExecuteDBSelect(select$, GetLastScheduledRecordingIdCallback, selectData, invalid)

	return selectData.id

End Function


Sub AddDBScheduledRecording(scheduledRecording As Object)

	insertSQL$ = "INSERT INTO ScheduledRecordings (DateTime, Duration, Title, InputSource, Channel, RecordingBitRate, SegmentRecording) VALUES(?,?,?,?,?,?,?);"

	params = CreateObject("roArray", 5, false)
	params[ 0 ] = scheduledRecording.dateTime
	params[ 1 ] = scheduledRecording.duration%
	params[ 2 ] = scheduledRecording.title$
	params[ 3 ] = scheduledRecording.inputSource$
	params[ 4 ] = scheduledRecording.channel$
	params[ 5 ] = scheduledRecording.recordingBitRate%
	params[ 6 ] = scheduledRecording.segmentRecording%

	m.ExecuteDBInsert(insertSQL$, params)

End Sub


Sub DeleteDBScheduledRecording(scheduledRecordingId$ As String)

	SQLITE_COMPLETE = 100

	delete$ = "DELETE FROM ScheduledRecordings WHERE Id = " + scheduledRecordingId$ + ";"

	deleteStatement = m.db.CreateStatement(delete$)

	if type(deleteStatement) <> "roSqliteStatement" then
        print "DeleteStatement failure - " + delete$
		stop
	endif

	sqlResult = deleteStatement.Run()

	if sqlResult <> SQLITE_COMPLETE
        print "sqlResult <> SQLITE_COMPLETE"
	endif

	deleteStatement.Finalise()

End Sub


Sub GetDBScheduledRecordingsCallback(resultsData As Object, selectData As Object)

	selectData.scheduledRecordings.push(resultsData)

End Sub


Function GetDBScheduledRecordings() As Object

	selectData = {}
	selectData.scheduledRecordings = []

	select$ = "SELECT Id, DateTime, Duration, Title, InputSource, Channel, RecordingBitRate, SegmentRecording FROM ScheduledRecordings;"
	m.ExecuteDBSelect(select$, GetDBScheduledRecordingsCallback, selectData, invalid)

	return selectData.scheduledRecordings

End Function



Sub AddDBRecording(scheduledRecording As Object)

	' convert duration from msec to minutes
	duration% = (scheduledRecording.duration% + 30000) / 60000

	insertSQL$ = "INSERT INTO Recordings (Title, StartDateTime, Duration, FileName, LastViewedPosition, TranscodeComplete, HLSSegmentationComplete, HLSUrl) VALUES(?,?,?,?,?,?,?,?);"

	params = CreateObject("roArray", 7, false)
	params[ 0 ] = scheduledRecording.title$
	params[ 1 ] = scheduledRecording.dateTime.GetString()
	params[ 2 ] = duration%
	params[ 3 ] = scheduledRecording.fileName$
	params[ 4 ] = 0
	params[ 5 ] = 0
	params[ 6 ] = 0
	params[ 7 ] = ""

	m.ExecuteDBInsert(insertSQL$, params)

	' TODO - last_insert_rowid - return the id of the added recording

End Sub


Sub DeleteDBRecording(recordingId$ As String)

	SQLITE_COMPLETE = 100

	delete$ = "DELETE FROM Recordings WHERE RecordingId = " + recordingId$ + ";"

	deleteStatement = m.db.CreateStatement(delete$)

	if type(deleteStatement) <> "roSqliteStatement" then
        print "DeleteStatement failure - " + delete$
		stop
	endif

	sqlResult = deleteStatement.Run()

	if sqlResult <> SQLITE_COMPLETE
        print "sqlResult <> SQLITE_COMPLETE"
	endif

	deleteStatement.Finalise()

End Sub


Sub GetDBLastTunedChannelCallback(resultsData As Object, selectData As Object)

	selectData.lastTunedChannel$ = resultsData["Channel"]

End Sub


Function GetDBLastTunedChannel() As Object

	selectData = {}
	selectData.lastTunedChannel$ = ""

	select$ = "SELECT LastTunedChannel.Channel FROM LastTunedChannel;"
	m.ExecuteDBSelect(select$, GetDBLastTunedChannelCallback, selectData, invalid)

	return selectData.lastTunedChannel$

End Function


Sub SetDBLastTunedChannel(channel$ As String)

    m.db.RunBackground("UPDATE LastTunedChannel SET Channel='" + channel$ + "';", {})

End Sub



Sub GetDBLastSelectedShowIdCallback(resultsData As Object, selectData As Object)

	selectData.lastSelectedShowId$ = resultsData["Id"]

End Sub


Function GetDBLastSelectedShowId() As Object

	selectData = {}
	selectData.lastSelectedShowId$ = ""

	select$ = "SELECT LastSelectedShow.Id FROM LastSelectedShow;"
	m.ExecuteDBSelect(select$, GetDBLastSelectedShowIdCallback, selectData, invalid)

	return selectData.lastSelectedShowId$

End Function


Sub SetDBLastSelectedShowId(lastSelectedShowId$ As String)

	existingShowId = m.GetDBLastSelectedShowId()
'	if existingShowId = null then
'		insertSQL$ = "INSERT INTO LastSelectedShow (Id) VALUES(:id_param);"
'		params = { id_param: lastSelectedShowId$ }
'		m.ExecuteDBInsert(insertSQL$, params)
'	else
	    m.db.RunBackground("UPDATE LastSelectedShow SET Id='" + lastSelectedShowId$ + "';", {})
'	endif

End Sub


Sub GetDBRecordingsCallback(resultsData As Object, selectData As Object)

	resultsData.Path = GetFilePath(resultsData.FileName)
	selectData.recordings.push(resultsData)

End Sub


Function GetDBRecordings() As Object

	selectData = {}
	selectData.recordings = []

	select$ = "SELECT RecordingId, Title, StartDateTime, Duration, FileName, LastViewedPosition, TranscodeComplete, HLSSegmentationComplete, HLSUrl FROM Recordings;"
	m.ExecuteDBSelect(select$, GetDBRecordingsCallback, selectData, invalid)

	return selectData.recordings

End Function


Sub GetDBRecordingCallback(resultsData As Object, selectData As Object)

	resultsData.Path = GetFilePath(resultsData.FileName)
	selectData.recording = resultsData

End Sub


Function GetDBRecording(recordingId As String) As Object

	selectData = {}
	selectData.recording = invalid

	select$ = "SELECT RecordingId, Title, StartDateTime, Duration, FileName, LastViewedPosition, TranscodeComplete, HLSSegmentationComplete, HLSUrl FROM Recordings WHERE RecordingId='" + recordingId + "';"
	m.ExecuteDBSelect(select$, GetDBRecordingCallback, selectData, invalid)

	return selectData.recording

End Function


Function GetDBRecordingByFileName(fileName$ As String) As Object

	selectData = {}
	selectData.recording = invalid

	select$ = "SELECT RecordingId, Title, StartDateTime, Duration, FileName, LastViewedPosition, TranscodeComplete, HLSSegmentationComplete, HLSUrl FROM Recordings WHERE FileName='" + fileName$ + "';"
	m.ExecuteDBSelect(select$, GetDBRecordingCallback, selectData, invalid)

	return selectData.recording

End Function


Function GetDBSettingsCallback(resultsData As Object, selectData As Object) As Object

	selectData.settings = resultsData

End Function


Function GetDBSettings() As Object

	selectData = {}
	selectData.settings = invalid

	select$ = "SELECT RecordingBitRate, SegmentRecordings FROM Settings;"
	m.ExecuteDBSelect(select$, GetDBSettingsCallback, selectData, invalid)

	return selectData.settings

End Function


Sub SetDBSettings(recordingBitRate As Integer, segmentRecordings As Integer)

	m.db.RunBackground("UPDATE Settings SET RecordingBitRate=" + stri(recordingBitRate) + ", SegmentRecordings=" + stri(segmentRecordings) + ";", {})

End Sub


Sub GetDBFileToTranscodeCallback(resultsData As Object, selectData As Object)

	resultsData.Path = GetFilePath(resultsData.FileName)
	selectData.recording = resultsData

End Sub


Function GetDBFileToTranscode() As Object

	selectData = {}
	selectData.recording = invalid

	select$ = "SELECT RecordingId, Title, StartDateTime, Duration, FileName, LastViewedPosition, TranscodeComplete FROM Recordings WHERE TranscodeComplete=0;"
	m.ExecuteDBSelect(select$, GetDBFileToTranscodeCallback, selectData, invalid)

	return selectData.recording

End Function


Sub UpdateDBTranscodeComplete(recordingId% As Integer)

    params = { ri_param: recordingId% }

    m.db.RunBackground("UPDATE Recordings SET TranscodeComplete=1 WHERE RecordingId=:ri_param;", params)

End Sub


Sub UpdateHLSSegmentationComplete(recordingId% As Integer, hlsUrl$ As String)

    params = { ri_param: recordingId%, hu_param: hlsUrl$ }

    m.db.RunBackground("UPDATE Recordings SET HLSSegmentationComplete=1, HLSUrl=:hu_param WHERE RecordingId=:ri_param;", params)

End Sub


Sub UpdateDBLastViewedPosition(recordingId% As Integer, lastViewedPosition% As Integer)

    params = { ri_param: recordingId%, lv_param: lastViewedPosition% }

    m.db.RunBackground("UPDATE Recordings SET LastViewedPosition=:lv_param WHERE RecordingId=:ri_param;", params)

End Sub


Function GetMP4FilePath(fileName$ As String) As String

	mp4Path$ = "content/" + fileName$ + ".mp4"
	readFile = CreateObject("roReadFile", mp4Path$)
	if type(readFile) = "roReadFile" return mp4Path$

	return ""

End Function


Function GetTSFilePath(fileName$ As String) As String

	tsPath$ = "content/" + fileName$ + ".ts"
	readFile = CreateObject("roReadFile", tsPath$)
	if type(readFile) = "roReadFile" return tsPath$
	
	return ""

End Function


Function GetFilePath(fileName$ As String) As String

	mp4Path$ = GetMP4FilePath(fileName$)
	if mp4Path$ <> "" return mp4Path$

	return GetTSFilePath(fileName$)

End Function


Function tsDeletable(recordingId% As Integer) As Boolean

	recording = m.GetDBRecording(stri(recordingId%))
	mp4FilePath$ = GetMP4FilePath(recording.FileName)
	if mp4FilePath$ <> "" then
		' if recording.HLSSegmentationComplete = 1 return true
		' temporary - until information about whether or not segmentation will be complete is persistent
		return true
	endif

	return false

End Function


Sub AddDBStation(atsc As String, commonName As String, name as String, stationId as String, callSign As String)

	insertSQL$ = "INSERT INTO Stations (Atsc, CommonName, Name, StationId, CallSign) VALUES(?,?,?,?,?);"

	params = CreateObject("roArray", 5, false)
	params[ 0 ] = atsc
	params[ 1 ] = commonName
	params[ 2 ] = name
	params[ 3 ] = stationId
	params[ 4 ] = callSign

	m.ExecuteDBInsert(insertSQL$, params)

End Sub


' hard code for now
Sub PopulateStationsTable()

	m.AddDBStation("2.1", "KTVU", "KTVUDT (KTVU-DT)", "19571", "KTVUDT")
	m.AddDBStation("4.1", "KRON", "KRONDT (KRON-DT)", "19573", "KRONDT")
	m.AddDBStation("5.1", "KPIX", "KPIXDT (KPIX-DT)", "19572", "KPIXDT")
	m.AddDBStation("7.1", "KGO", "KGODT (KGO-DT)", "19574", "KGODT")
	m.AddDBStation("9.1", "KQED", "KQEDDT (KQED-DT)", "24344", "KQEDDT")
	m.AddDBStation("9.2", "KQED-2", "KQEDDT2 (KQED-DT2)", "30507", "KQEDDT2")
	m.AddDBStation("9.3", "KQED-3", "KQEDDT3 (KQED-DT3)", "35278", "KQEDDT3")
	m.AddDBStation("11.1", "KNTV", "KNTVDT (KNTV-DT)", "21785", "KNTVDT")
	m.AddDBStation("36.1", "KICU", "KICUDT (KICU-DT)", "21650", "KICUDT")
	m.AddDBStation("44.1", "KBCW", "KBCWDT (KBCW-DT)", "19575", "KBCWDT")

End Sub


Sub GetDBStationsCallback(resultsData As Object, selectData As Object)

	selectData.stations.push(resultsData)

End Sub


Function GetDBStations() As Object

	selectData = {}
	selectData.stations = []

	select$ = "SELECT Atsc, CommonName, Name, StationId, CallSign FROM Stations;"
	m.ExecuteDBSelect(select$, GetDBStationsCallback, selectData, invalid)

	return selectData.stations

End Function


Sub AddDBStationScheduleForSingleDay(stationId As String, scheduleDate As String, modifiedDate as String, md5 as String)

	insertSQL$ = "INSERT INTO StationSchedulesForSingleDay (StationId, ScheduleDate, ModifiedDate, MD5) VALUES(?,?,?,?);"

	params = CreateObject("roArray", 4, false)
	params[ 0 ] = stationId
	params[ 1 ] = scheduleDate
	params[ 2 ] = modifiedDate
	params[ 3 ] = md5

	m.ExecuteDBInsert(insertSQL$, params)

End Sub


Sub GetDBStationSchedulesForSingleDayCallback(resultsData As Object, selectData As Object)

	selectData.stationSchedulesForSingleDay.push(resultsData)

End Sub


Function GetDBStationSchedulesForSingleDay() As Object

	selectData = {}
	selectData.stationSchedulesForSingleDay = []

	select$ = "SELECT StationId, ScheduleDate, ModifiedDate, MD5 FROM StationSchedulesForSingleDay;"
	m.ExecuteDBSelect(select$, GetDBStationSchedulesForSingleDayCallback, selectData, invalid)

	return selectData.stationSchedulesForSingleDay

End Function


Sub AddDBProgramForStation(stationId As String, scheduleDate As String, programId As String, airDateTime As String, duration As String, md5 as String)

	insertSQL$ = "INSERT INTO ProgramsForStations (StationId, ScheduleDate, ProgramId, AirDateTime, Duration, MD5) VALUES(?,?,?,?,?,?);"

	params = CreateObject("roArray", 6, false)
	params[ 0 ] = stationId
	params[ 1 ] = scheduleDate
	params[ 2 ] = programId
	params[ 3 ] = airDateTime
	params[ 4 ] = duration
	params[ 5 ] = md5

	m.ExecuteDBInsert(insertSQL$, params)

End Sub


Sub AddDBProgram(programId As String, title As String, description as String)

	insertSQL$ = "INSERT INTO Programs (ProgramId, Title, Description) VALUES(?,?,?);"

	params = CreateObject("roArray", 3, false)
	params[ 0 ] = programId
	params[ 1 ] = title
	params[ 2 ] = description

	m.ExecuteDBInsert(insertSQL$, params)

End Sub


Sub AddDBPrograms(programs As Object)

print "AddDBPrograms start"

	programIndex = 0
	remainingPrograms = programs.Count()

	maxBatchSize = 500

	while remainingPrograms > 0
	
		if remainingPrograms >= maxBatchSize then
			batchSize = maxBatchSize
		else
			batchSize = remainingPrograms
		endif

		startingBatchSize = batchSize

		insertSQL$ = "INSERT INTO Programs "

		while batchSize > 0
			
			program = programs[programIndex]
			t$ = SanitizeString(program.title)
			d$ = SanitizeString(program.description)

			if batchSize = startingBatchSize then
				insertSQL$ = insertSQL$ + " SELECT '" + program.programId + "' AS ProgramId, '" + t$ + "' AS Title, '" + d$ + "' AS Description "
			else
				insertSQL$ = insertSQL$ + " UNION SELECT '" + program.programId + "', '" + t$ + "', '" + d$ + "'"
			endif

			programIndex = programIndex + 1
			batchSize = batchSize - 1

		end while

		if startingBatchSize > 0 then
			params = []
print "AddDBPrograms initiate insert"
			m.ExecuteDBInsert(insertSQL$, params)
print "AddDBPrograms insert complete"
		endif

		remainingPrograms = remainingPrograms - startingBatchSize

	end while

print "AddDBPrograms complete"

End Sub


Function SanitizeString(s$ As String) As String
'	' = 39
'	" = 34

	for i% = 0 to len(s$)
		c = asc(mid(s$, i% + 1, 1))
		if c = 39 or c = 34 then
			s$ = mid(s$, 1, i%) + "-" + mid(s$, i% + 2)
		endif
	next

	return s$

End Function


Sub AddDBCastMember(programId As String, name As String, billingOrder as String)

	insertSQL$ = "INSERT INTO ProgramCast (ProgramId, Name, BillingOrder) VALUES(?,?,?);"

	params = CreateObject("roArray", 3, false)
	params[ 0 ] = programId
	params[ 1 ] = name
	params[ 2 ] = billingOrder

	m.ExecuteDBInsert(insertSQL$, params)

End Sub


Sub AddDBCastMembers(castMembers As Object)
End Sub


Function GenerateSQLInsert(rowObjects As Object, tableName$ As String, columnKeys As Object, dbColumnNames As Object, columnSanitizationNecessary As Object, startingRowIndex% As Integer, numItemsToInsert% As Integer) As String

	insertSQL$ = "INSERT INTO " + tableName$ + " SELECT "

	for rowIndex% = 0 to numItemsToInsert% - 1

		adjustedRowIndex% = rowIndex% + startingRowIndex%

		rowObject = rowObjects[adjustedRowIndex%]

		if rowIndex% = 0 then
			' insertSQL$ = insertSQL$ + " SELECT '" + program.programId + "' AS ProgramId, '" + t$ + "' AS Title, '" + d$ + "' AS Description "

			columnValues = CreateObject("roArray", columnKeys.Count(), true)

			for columnIndex% = 0 to columnKeys.Count() - 1

				columnValues[columnIndex%] = rowObject[columnKeys[columnIndex%]]

				if columnSanitizationNecessary[columnIndex%] then
					columnValues[columnIndex%] = SanitizeString(columnsValues[columnIndex%])
				endif
			
				if columnIndex% > 0 then
					insertSQL$ = insertSQL$ + ", "
				endif

				insertSQL$ = insertSQL$ + "'" + columnValues[columnIndex%] + "' AS " + dbColumnNames[columnIndex%]

			next

			insertSQL$ = insertSQL$ + " "

		else

			' insertSQL$ = insertSQL$ + " UNION SELECT '" + program.programId + "', '" + t$ + "', '" + d$ + "'"
			insertSQL$ = insertSQL$ + "UNION SELECT "

			columnValues = CreateObject("roArray", columnKeys.Count(), true)

			for columnIndex% = 0 to columnKeys.Count() - 1

				columnValues[columnIndex%] = rowObject[columnKeys[columnIndex%]]

				if columnSanitizationNecessary[columnIndex%] then
					columnValues[columnIndex%] = SanitizeString(columnValues[columnIndex%])
				endif
			
				if columnIndex% > 0 then
					insertSQL$ = insertSQL$ + ", "
				endif

				insertSQL$ = insertSQL$ + "'" + columnValues[columnIndex%] + "'"

			next

			insertSQL$ = insertSQL$ + " "

		endif

	next

	return insertSQL$

End Function


Sub AddDBItems(insertItems As Object, columnKeys As Object, dbColumnNames As Object, columnSanitizationNecessary As Object, tableName$ As String)

	print "AddDBItems start"

	itemIndex = 0
'	chunkSize = 500
	chunkSize = 10
	remainingItems = insertItems.Count()

	while remainingItems > 0

		if remainingItems > chunkSize
			numItemsToInsert = chunkSize
		else
			numItemsToInsert = remainingItems
		endif

		insertSQL$ = GenerateSQLInsert(insertItems, tableName$, columnKeys, dbColumnNames, columnSanitizationNecessary, itemIndex, numItemsToInsert)
stop
		remainingItems = remainingItems - numItemsToInsert
		itemIndex = itemIndex + numItemsToInsert

print "AddDBPrograms initiate insert"
		params = []
		m.ExecuteDBInsert(insertSQL$, params)
stop
print "AddDBPrograms insert complete"

	end while

End Sub


Sub AddDBStationSchedulesForSingleDay(stationSchedulesForSingleDay)

	columnKeys = []
	columnKeys.push("stationId")
	columnKeys.push("scheduleDate")
	columnKeys.push("modifiedDate")
	columnKeys.push("md5")

	dbColumnNames = []
	dbColumnNames.push("StationId")
	dbColumnNames.push("ScheduleDate")
	dbColumnNames.push("ModifiedDate")
	dbColumnNames.push("MD5")

	columnSanitizationNecessary = []
	columnSanitizationNecessary.push(false)
	columnSanitizationNecessary.push(false)
	columnSanitizationNecessary.push(false)
	columnSanitizationNecessary.push(false)

	m.AddDBItems(stationSchedulesForSingleDay, columnKeys, dbColumnNames, columnSanitizationNecessary,  "StationSchedulesForSingleDay")

End Sub
