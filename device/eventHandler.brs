Function newEventHandler(jtr As Object) As Object

	EventHandler = {}

	EventHandler.jtr = jtr
	EventHandler.msgPort = jtr.msgPort

	EventHandler.hsms = []

	EventHandler.AddHSM				= eventHandler_AddHSM
	EventHandler.EventLoop			= eventHandler_EventLoop

	return EventHandler

End Function


Sub eventHandler_AddHSM( hsm As Object )

	m.hsms.push( hsm )

End Sub


Sub eventHandler_EventLoop()

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

		if type(msg) = "roSqliteEvent" then
			if msg.GetSqlResult() <> SQLITE_COMPLETE then
				m.diagnostics.PrintDebug("roSqliteEvent.GetSqlResult() <> SQLITE_COMPLETE")
				if type(msg.GetSqlResult()) = "roInt" then
'					m.diagnostics.PrintDebug("roSqliteEvent.GetSqlResult() = " + stri(roSqliteEvent.GetSqlResult()))
					 print "roSqliteEvent.GetSqlResult() = " + stri(roSqliteEvent.GetSqlResult())
				endif
			endif
		endif

		if type(msg) = "roIRRemotePress" then
			if msg = 2 then
				m.jtr.LaunchWebkit()
			endif
		endif

		if type(msg) = "roHtmlWidgetEvent" then		    
			payload = msg.GetData()
			print payload

			print "Reason: "; payload.reason

			if payload.reason = "message" then
				print "Message: "; payload.message
				aa = {}
				aa.AddReplace("bsMessage", "received message: " + payload.message.message)
				m.jtr.htmlWidget.PostJSMessage(aa)
			end if
		endif

		if type(msg) = "roHttpEvent" then
        
			userdata = msg.GetUserData()
			if type(userdata) = "roAssociativeArray" and type(userdata.HandleEvent) = "roFunction" then
				userData.HandleEvent(userData, msg)
			endif

		else

			numHSMs% = m.hsms.Count()
			for i% = 0 to numHSMs% - 1
				m.hsm = m.hsms[i%]
				m.hsm.Dispatch(msg)
			next

		endif

	end while

End Sub


