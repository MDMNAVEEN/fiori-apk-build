jQuery.sap.declare("MDM_QIR.Formatter.formatter");

var fnGetImagePath = function(sFile) {
	return jQuery.sap.getModulePath("MDM_QIR") + "/Images/" + sFile;
};

MDM_QIR.Formatter.formatter = {
	// Formatter fn to convert Date to EdmDateTime

	formatDate: function(oDate) {

		if (!oDate) {
			return "";
		}

		var oDateObj;

		// Case 1: OData format /Date(...)
		if (typeof oDate === "string" && oDate.includes("/Date(")) {
			var iTime = parseInt(oDate.replace(/[^0-9]/g, ""));
			oDateObj = new Date(iTime);
		}
		// Case 2: YYYYMMDD (very common in SAP)
		else if (typeof oDate === "string" && oDate.length === 8) {
			oDateObj = new Date(
				oDate.substring(0, 4),
				oDate.substring(4, 6) - 1,
				oDate.substring(6, 8)
			);
		}
		// Case 3: normal date
		else {
			oDateObj = new Date(oDate);
		}

		if (isNaN(oDateObj)) {
			return "";
		}

		var oDateFormat = sap.ui.core.format.DateFormat.getDateInstance({
			pattern: "dd-MMM-yyyy"
		});

		return oDateFormat.format(oDateObj);
	},
	fnCoverttoEdmDateTime: function(vDate) {
		if (!vDate) {
			return null;
		}
		return vDate.substring(0, 4) + "-" +
			vDate.substring(4, 6) + "-" +
			vDate.substring(6, 8) + "T00:00:00";
	},
	// Formatter fn to convert dec values into Decimals with Precision 5 and Scale 2
	fnConverttoEdmDecimal5_2: function(vValue) {
		if (vValue === "" || vValue === null || vValue === undefined) {
			return "0.00";
		}
		var vDecVal = parseFloat(vValue);
		if (isNaN(vDecVal)) {
			return "0.00";
		}
		if (vDecVal > 999.99) {
			vDecVal = 999.99;
		}

		return vDecVal.toFixed(2);
	},
	fnConvertToTimestamp: function(vDate) {
		if (!vDate) {
			return "00000000000000";
		}

		var year = vDate.substring(0, 4);
		var month = vDate.substring(4, 6);
		var day = vDate.substring(6, 8);

		var oNow = new Date();
		var hh = String(oNow.getHours()).padStart(2, "0");
		var mm = String(oNow.getMinutes()).padStart(2, "0");
		var ss = String(oNow.getSeconds()).padStart(2, "0");

		return year + month + day + hh + mm + ss;
	},
	// Duplicate popup indicators
	fnDuplicationIndicator: function(Indicator) {
		switch (Indicator) {
			case "R":
				return fnGetImagePath("redicon.svg");
			case "O":
				return fnGetImagePath("orangeIcon.svg");
			case "Y":
				return fnGetImagePath("yellowicon.svg");
		}
	},

	// Dashboard formatter functions
	fnDBgetStatusIcon: function(sStatus) {

		if (sStatus === "Completed" || sStatus === "Complete") {
			return fnGetImagePath("CompletedStatus.svg");
		} else if (sStatus === "Requested / Inprogress") { //|| sStatus === "00" || sStatus === "" || sStatus === "01" || sStatus === "04") { 
			// return fnGetImagePath("InprogressStatus.svg"); 
			return fnGetImagePath("Drafted.svg");
		} else if (sStatus === "Saved as draft") {
			return fnGetImagePath("SaveAsDraft.svg");
		} else if (sStatus === "Rejected" || sStatus === "Reject") {
			return fnGetImagePath("RejectStatus.svg");
		} else if (sStatus === "Sendback") {
			return fnGetImagePath("sendbackTable.svg");
		}
	},
	fnremoveLeadingZeros: function(value) {
		if (!value) {
			return value;
		}

		return value.toString().replace(/^0+/, '');
	},
	fnDBformatODataTime: function(oTime) {
		if (!oTime || typeof oTime.ms !== "number") return "";

		// Get total milliseconds from midnight
		var totalMs = oTime.ms;

		// Convert to hours, minutes, seconds
		var hours = Math.floor(totalMs / 3600000);
		var minutes = Math.floor((totalMs % 3600000) / 60000);
		var seconds = Math.floor((totalMs % 60000) / 1000);

		// Format with leading zeros
		var hh = String(hours).padStart(2, "0");
		var mm = String(minutes).padStart(2, "0");
		var ss = String(seconds).padStart(2, "0");

		return hh + ":" + mm + ":" + ss;
	},
	fnDBgetLevelStatusIcon: function(sStatus) {

		if (sStatus === "Completed" || sStatus === "Complete") {
			return fnGetImagePath("CompletedDot.svg");
		} else if (sStatus === "Requested / Inprogress") {
			return fnGetImagePath("InprogressDot.svg");
		} else if (sStatus === "Saved as draft") {
			return fnGetImagePath("draftDot.svg");
		} else if (sStatus === "Rejected" || sStatus === "Reject") {
			return fnGetImagePath("RejectedDot.svg");
		} else if (sStatus === "Sendback") {
			return fnGetImagePath("senbackDot.svg");
		} else if (sStatus === "Initiated") {
			return fnGetImagePath("InitiatedDot.svg");
		}
	},
	getStatusClass: function(status) {
		switch (status) {
			case "Completed":
				return "cl_CompletedStatus";

			case "Requested / Inprogress":
				return "cl_statusInprogress";
			case "Rejected":
				return "cl_Rejectstatus";
			case "Complete":
				return "cl_CompletedStatus";
			case "Saved as draft":
				return "cl_draftstatus";
			case "Reject":
				return "cl_Rejectstatus";
			case "Sendback":
				return "cl_sendBack";
			case "Initiated":
				return "cl_initiated";
			default:
				return "statusDefault";
		}
	},
	// Duplicate highloght indicators
	fnDuplicationColour: function(Indi) {

		switch (Indi) {
			case "X":
				return "True";
			default:
				return "False";

		}
	},
	fnFormatLevelText: function(vLevel) {
		if (!vLevel) {
			return "";
		}
		if (vLevel.startsWith("L")) {
			return "Level " + vLevel.substring(1);
		}
		return vLevel;
	},
	fnUWLIndicator: function(Indicator) {
		switch (Indicator) {
			case "O":
				return fnGetImagePath("orangeIcon.svg");
			case "G":
				return fnGetImagePath("NodesGrn.svg");
			case "R":
				return fnGetImagePath("redicon.svg");
			default:
				return fnGetImagePath("NodesGrn.svg");

		}
	},

	fnDBformatODataTime: function(oTime) {
		if (!oTime || typeof oTime.ms !== "number") return "";
		var oDate = new Date(null);
		oDate.setMilliseconds(oTime.ms);
		var oFormat = sap.ui.core.format.DateFormat.getTimeInstance({
			pattern: "HH:mm:ss",
			UTC: true
		});
		return oFormat.format(oDate);
	},
	getStatusText: function(status) {
		switch (status) {
			case "Complete":
				return "Completed";

				break;
			case "Completed":
				return "Completed";

				break;
			case "Requested / Inprogress":
				return "Awaiting for Approve";
				break;
			case "Initiated":
				return "Initiated";

				break;

			case "Pending":
				return "Awaiting for Approve";

				break;

			case "Rejected":
				return "Rejected";

				break;
			case "Reject":
				return "Rejected";

				break;
			case "Saved as draft":
				return "Saved as Draft";

				break;
			case "Sendback":
				return "Sendback";

				break;
			default:
				return status;
				break;

		} // 
	},
	getStatusClass: function(status) {
		switch (status) {
			case "Completed":
				return "cl_textTableItemComp";

			case "Requested / Inprogress":
				return "cl_textTableItemPend";

			case "Awaiting for Approve":
				return "cl_textTableItemPend";
			case "Pending":
				return "cl_textTableItemPend";
			case "Rejected":
				return "cl_textTableItemrejec";
			case "Complete":
				return "cl_textTableItemComp";
			case "Saved as draft":
				return "cl_textTableItemD";
			case "Reject":
				return "cl_textTableItemrejec";
			case "Sendback":
				return "cl_textTableItemSend";
			case "Initiated":
				return "cl_textTableItemComp";

		}
	},
	getStatuIcon: function(status) {
		switch (status) {
			case "Completed":
				return "cl_iconroundcomp";

			case "Requested / Inprogress":
				return "cl_iconroundpend";
			case "Pending":
				return "cl_iconroundpend";
			case "Awaiting for Approve":
				return "cl_iconroundpend";
			case "Rejected":
				return "cl_iconroundrejec";
			case "Complete":
				return "cl_iconroundcomp";
			case "Saved as draft":
				return "cl_iconrounddraft";
			case "Reject":
				return "cl_iconroundrejec";
			case "Sendback":
				return "cl_iconroundsend";
			case "Initiated":
				return "cl_iconroundcomp";

		}
	}

};
