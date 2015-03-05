Function newEventHandler(jtr As Object) As Object

	EventHandler = {}

	EventHandler.jtr = jtr
	EventHandler.msgPort = jtr.msgPort

	EventHandler.hsms = []
	EventHandler.eventHandlers = []
	EventHandler.engines = []

	EventHandler.AddHSM				= eventHandler_AddHSM
	EventHandler.AddEventHandler	= eventHandler_AddEventHandler
	EventHandler.AddEngine			= eventHandler_AddEngine
	EventHandler.EventLoop			= eventHandler_EventLoop

	return EventHandler

End Function


Sub eventHandler_AddHSM( hsm As Object )

	m.hsms.push( hsm )

End Sub


Sub eventHandler_AddEventHandler( eventHandler As Object )

	m.eventHandlers.push(eventHandler)

End Sub


Sub eventHandler_AddEngine( engine As Object )

	m.engines.push(engine)

End Sub


Sub eventHandler_EventLoop()

	SQLITE_COMPLETE = 100

    while true
        
        msg = wait(0, m.msgPort)

'		m.diagnostics.PrintTimestamp()
'		m.diagnostics.PrintDebug("msg received - type=" + type(msg))
		print "msg received - type=" + type(msg)

	    if type(msg) = "roControlDown" and stri(msg.GetSourceIdentity()) = stri(m.controlPort.GetIdentity()) then
            if msg.GetInt()=12 then
                stop
            endif
        endif

		if type(msg) = "roIRRemotePress" then
			print "remote data = ";msg.getint()
		endif

		if type(msg) = "roIRDownEvent" then
			print "roIRDownEvent data = ";msg
		endif

		if type(msg) = "roIRRepeatEvent" then
			print "roIRRepeatEvent data = ";msg
		endif
		
		if type(msg) = "roSqliteEvent" then
			if msg.GetSqlResult() <> SQLITE_COMPLETE then
				m.diagnostics.PrintDebug("roSqliteEvent.GetSqlResult() <> SQLITE_COMPLETE")
				if type(msg.GetSqlResult()) = "roInt" then
'					m.diagnostics.PrintDebug("roSqliteEvent.GetSqlResult() = " + stri(roSqliteEvent.GetSqlResult()))
					 print "roSqliteEvent.GetSqlResult() = " + stri(roSqliteEvent.GetSqlResult())
				endif
			endif
		endif

		if type(msg) = "roHttpEvent" then
        
			userdata = msg.GetUserData()
			if type(userdata) = "roAssociativeArray" and type(userdata.HandleEvent) = "roFunction" then
				userData.HandleEvent(userData, msg)
			endif

		else

			numEventHandlers% = m.eventHandlers.Count()
			for i% = 0 to numEventHandlers% - 1
				m.eventHandler = m.eventHandlers[i%]
'				m.eventHandler.EventHandler(msg)
				m.eventHandler(m.jtr, msg)
			next

			numEngines% = m.engines.Count()
			for i% = 0 to numEngines% - 1
				m.engines[i%].EventHandler(msg)
			next

			numHSMs% = m.hsms.Count()
			for i% = 0 to numHSMs% - 1
				m.hsm = m.hsms[i%]
				m.hsm.Dispatch(msg)
			next

		endif

	end while

End Sub


