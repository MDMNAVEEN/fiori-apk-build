sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"MDM_QIR/controller/ErrorHandler",
	"sap/m/library"
], function(Controller, ErrorHandler, mobileLibrary) {
	"use strict";
	var i18n;
	var URLHelper = mobileLibrary.URLHelper;
	var busyDialog = new sap.m.BusyDialog();
	return Controller.extend("MDM_QIR.controller.BaseController", {

		onInit: function() {
			this.f4Cache = {};
			this.getView().getModel("i18n");

			var oBundle = this.getOwnerComponent()
				.getModel("i18n")
				.getResourceBundle();
			i18n = this.getOwnerComponent().getModel("i18n").getResourceBundle();
			var oConfigModel = this.getOwnerComponent().getModel("JM_Config");
			var oJsonModel = this.getOwnerComponent().getModel("JM_UserModel");
			var that = this;
			oConfigModel.read("/UsernameSet", {
				success: function(oData) {
					oJsonModel.setData(oData.results);
					that.userName = oData.results[0].Uname;
					that.getOwnerComponent().setModel(oJsonModel, "JM_UserModel");
				},
				error: function(err) {
					ErrorHandler.showCustomSnackbar(i18n.getText("userName_fetch_err"), "Error", that);
					return;
				}
			});
			var oViewStateModel = new sap.ui.model.json.JSONModel({
				processRunning: false
			});

			this.getView().setModel(oViewStateModel, "viewState");

			this.getOwnerComponent()
				.getRouter()
				.attachRouteMatched(this._onRouteMatched, this);

		},
		// _onRouteMatched: function(oEvent) {
		// 	var sRouteName = oEvent.getParameter("name");

		// 	var oList = this.byId("id_list");
		// 	if (!oList) return;

		// 	var aItems = oList.getItems();

		// 	aItems.forEach(function(oItem) {
		// 		oItem.removeStyleClass("cl_glowMenuItem"); // clear all

		// 		if (oItem.data("target") === sRouteName) {
		// 			oItem.addStyleClass("cl_glowMenuItem");
		// 		}
		// 	});
		// },
		_onRouteMatched: function(oEvent) {

			var sRouteName = oEvent.getParameter("name");

			var oList = this.byId("id_list");

			if (!oList) {
				return;
			}

			var aItems = oList.getItems();

			aItems.forEach(function(oItem) {

				oItem.removeStyleClass("cl_glowMenuItem");

				var sTarget = oItem.data("target");

				// Normal match
				var bMatch = sTarget === sRouteName;

				// Special case
				if ((sRouteName === "KeyData" || sRouteName === "Initiator" || sRouteName === "MassCreate" || sRouteName === "MassChange") &&
					sTarget === "Search") {
					bMatch = true;
				}

				if ((sRouteName === "Compare" || sRouteName === "Analytics") && sTarget === "Dashboard") {
					bMatch = true;
				}

				if (bMatch) {
					oItem.addStyleClass("cl_glowMenuItem");
				}

			});
		},
		fn_f4rowSelect: function(oEvent) {

			var oTable = oEvent.getSource();

			// Get selected row index
			var iIndex = oTable.getSelectedIndex();

			if (iIndex === -1) {
				return;
			}

			// Get binding context of selected row
			var oContext = oTable.getContextByIndex(iIndex);
			var oData = oContext.getObject();

			// Get values
			var sValue = oData.Value1;
			if (sValue === "") {
				sValue = '0';
			}
			var sValueDes = oData.Value2;

			var sInputId = this._currentInputId.split("--")[1];
			if (sInputId === "ID_QIR_ICV2_VARIABNAHM") {
				sValue = oData.Value3;
				sValueDes = oData.Value4;
			}
			// this.byId(sInputId).setValue(sValue);
			// Set to input field
			if (this._currentControl) {
				this._currentControl.setValue(sValue);
				this._currentControl.setValueState(
					sap.ui.core.ValueState.None
				);

				this._currentControl.setValueStateText("");
			}
			var oControl = this.byId(sInputId);
			if (oControl && oControl.setValueState) {
				oControl.setValueState(sap.ui.core.ValueState.None);
				oControl.setValueStateText("");
			}

			if (this.byId(sInputId + "DES")) {
				this.byId(sInputId + "DES").setValue(sValueDes);
			}

			if (oControl && this.fnFieldChange) {

				this.fnFieldChange({
					getSource: function() {
						return oControl;
					}
				});

			}
			var that = this;
			var oModel = this.getOwnerComponent().getModel();
			var oDataModel = this.getOwnerComponent().getModel("JM_Config");

			//Added By Naveen Kumar N for get UOM from backend while select matnr f4
			var sControlId = this._currentControl.getId();
			oModel.setUseBatch(false);
			console.log("this is input if while select f4", sControlId);
			if (sControlId.indexOf("SID_QIR_MATNR") !== -1) {
				// oPayload.FieldName1 = "";
				// oPayload.FieldValue1 = "";
				var oContext1 = this._currentControl.getBindingContext("JM_TableModel");
				var oRowData = oContext1.getObject();

				var vMatnrVal = oRowData.MATNR || "";
				var vMEPayload = {
					FieldId: "ID_QIR_MATNR",
					F4Type: "P",
					Process: "A",
					// FieldNam1: "MATNR",
					// Value1: vMatnrVal,
					NavSerchResult: []
				};

				console.log("uom payload", vMEPayload);
				oDataModel.create("/SearchHelpSet", vMEPayload, {
					success: function(oData) {
						console.log("f4 for unit of measure", oData);
						if (oData.MsgType === "S") {
							var aResults = oData.NavSerchResult.results || [];

							var oMatched = aResults.find(function(oItem) {
								return Number(oItem.Value1) === Number(vMatnrVal);
							});
							console.log("Matched Matnr", oMatched);

							if (oMatched) {

								// Current selected row
								var oRowContext = that._currentControl.getBindingContext("JM_TableModel");

								// Path of current row
								var sPath = oRowContext.getPath();

								// Set UOM into row model
								var oTableModel = that.getView().getModel("JM_TableModel");

								oTableModel.setProperty(
									sPath + "/ME", // property bound to ID_QIR_RV2_ME
									oMatched.Value2
								);

								oTableModel.refresh(true);
							}
						}
					},
					error: function(error) {
						ErrorHandler.showCustomSnackbar(i18n.getText("f4help_fetch_error"), "Error", that);
						return;
					}
				});
			}
			//End By Naveen Kumar N
			var contextAppid = this.getOwnerComponent().getModel("JM_ContextModel").getProperty("/Appid");
			if (sInputId === "ID_QIR_WERKS") {
				var oPayload = {
					AppId: contextAppid || "QIRMC",
					TransId: "",
					Ind: "I",
					Werks: sValue,
					NavGetInit: [],
					NavGetInitVal: [],
					NavKeyValues: [],
					NavAttachmentRead: [],
					NavCommentsRead: [],
					NavRules: []
				};

				var enableTable = this.getView().getModel("JM_EnableTable");
				busyDialog.open();
				oModel.setUseBatch(false);
				oModel.create("/KeyDataSet", oPayload, {
					success: function(oData) {
						console.log("Backend Response when select f4", oData);
						if (oData.MsgType === 'E') {
							ErrorHandler.showCustomSnackbar(oData.Message, "Error", that);
							busyDialog.close();
							enableTable.setProperty("/enable", false);
							enableTable.refresh(true);
							return;
						}
						enableTable.setProperty("/enable", true);
						enableTable.refresh(true);
						setTimeout(function() {
							that._buildDynamicTable(
								oData.NavGetInit.results
							);
							busyDialog.close();
						}.bind(this), 200);
						// busyDialog.close();
					},
					error: function(error) {
						console.log("Backend Response when select f4", error);
						busyDialog.close();
					}
				});
				// busyDialog.close();
			}
			this.fn_closefromto();
		},

		fn_getf4data: function(id) {
			console.log("f4 select matnr id", id);

			var oF4Model = this.getView().getModel("JM_F4Help");

			if (!oF4Model) {
				oF4Model = new sap.ui.model.json.JSONModel({
					data: []
				});
				this.getView().setModel(oF4Model, "JM_F4Help");
			}

			var oF4ColModel = this.getView().getModel("F4Header");
			if (!oF4ColModel) {
				oF4ColModel = new sap.ui.model.json.JSONModel({
					col1: "",
					col2: ""
				});
				this.getView().setModel(oF4Model, "JM_F4Help");
			}
			var oModel = this.getOwnerComponent().getModel("JM_Config");
			var sControlId = id.split("--").pop();

			var aFSearchHelpIds = [
				"ID_QIR_RV2_FREI_MGKZ",
				"ID_QIR_RV3_SPERRFKT",
				"ID_QIR_RV3_BLOCKVENDOR",
				"ID_QIR_ICV1_QSSYSVENDOR",
				"ID_QIR_ICV1_NOINSP",
				"ID_QIR_ICV2_NOINSPABN",
				"ID_QIR_ICV3_CERTCONTROL",
				"DID_WF_APPID"
			];
			var commonSearchHelpIds = [
				"ID_QIR_ICV1_NOINSP",
				"ID_QIR_ICV3_CERTCONTROL"
			];
			var process = sControlId[0];
			if (process === 'I' && !commonSearchHelpIds.includes(sControlId)) {
				process = 'A';
			} else if (process === 'D') {
				process = 'D';
			} else if (process === 'S') {
				process = 'S';
			} else {
				process = 'X';
			}
			var F4type = "";
			if (aFSearchHelpIds.includes(sControlId)) {
				F4type = "F";
			} else if (sControlId === "UID_USERID") {
				process = 'U';
				F4type = "P";
			} else {
				F4type = "P";
			}

			if (sControlId === "ID_QIR_WERKS") {
				process = 'A';
				F4type = "P";
			}

			var oPayload = {
				FieldId: sControlId,
				F4Type: F4type,
				Process: process,
				NavSerchResult: []
			};

			var that = this;
			console.log("F4 Payload", oPayload);

			oModel.create("/SearchHelpSet", oPayload, {

				success: function(oData) {

					var aResults = oData.NavSerchResult.results || [];

					console.log("f4result", aResults);

					if (sControlId === "ID_QIR_ICV1_QSSYSFAM") {
						aResults = aResults.filter(function(item) {
							return item.Value3 === "E";
						});

					}
					if (sControlId === "ID_QIR_ICV2_VARIABNAHM") {
						var oUniqueMap = {};
						var aUniqueResults = [];

						aResults.forEach(function(item) {

							// create unique key (based on your fields)
							var sKey = item.Value1 + "|" + item.Value2 + "|" + item.Value3 + "|" + item.Value4;

							if (!oUniqueMap[sKey]) {
								oUniqueMap[sKey] = true;
								aUniqueResults.push(item);
							}

						});

						// replace original data
						aResults = aUniqueResults;
					}
					aResults.forEach(function(item) {
						if (sControlId === "ID_QIR_ICV2_VARIABNAHM") { //SOURCE INSPECTION 
							item.Value1 = "";
							item.Label1 = "";
						}
						if (item.Value3 === "E") {
							item.Value3 = ""; // clear value
							item.Label3 = ""; // clear label
						}

						if (item.Value1) {
							if (sControlId.includes("WERKS")) {
								item.Value1 = item.Value1;
							} else {
								item.Value1 = item.Value1.replace(/^0+/, "");
							}
						}

						if (item.Value2) {
							item.Value2 = item.Value2.replace(/^0+/, "");
						}

						// if (item.Value4) {
						// 	item.Value4 = item.Value4.replace(/^0+/, "");
						// }

						if (item.DomvalueL) {
							item.Value1 = item.DomvalueL;

						}

						if (item.Ddtext) {
							item.Value2 = item.Ddtext;
						}
					});
					if (aResults.length !== 0) {
						oF4Model.setProperty("/data", aResults);
					} else {
						ErrorHandler.showCustomSnackbar(i18n.getText("no_f4values_for_given_field"), "Error", that);
						sap.ui.core.BusyIndicator.hide();
						return;
					}
					console.log(aResults);

					if (aResults.length > 0) {

						if (sControlId === "ID_QIR_ICV2_VARIABNAHM") {
							oF4ColModel.setProperty("/col1", "");
						} else {
							oF4ColModel.setProperty("/col1", aResults[0].Label1 || "Value");
						}

						oF4ColModel.setProperty("/col2", aResults[0].Label2);
						oF4ColModel.setProperty("/col3", aResults[0].Label3);
						oF4ColModel.setProperty("/col4", aResults[0].Label4);
					}
					oF4ColModel.refresh(true);
					sap.ui.core.BusyIndicator.hide();
					that.fn_OPENF4();
				},

				error: function() {
					ErrorHandler.showCustomSnackbar(i18n.getText("f4help_fetch_error"), "Error", that);
				}

			});

		},

		fn_openF4: function(oEvent) {

			this._currentControl = oEvent.getSource();

			var sId = oEvent.getSource().getId();

			this._currentInputId = sId.replace(/-__clone\d+$/, "");

			this.fn_getf4data(this._currentInputId);

		},
		fn_openTableF4: function(oEvent) { //Added By Naveen Kumar N for Table F4 Value
			this._currentControl = oEvent.getSource();

			var sFieldId = this._currentControl.data("FieldId");

			this._currentInputId = sFieldId;

			this.fn_getf4data(sFieldId);
		},
		fn_openpopover: function(oEvent) {
			if (!this._oPopover) {
				this._oPopover = sap.ui.xmlfragment(
					this.getView().getId(),
					"MDM_QIR.Fragments.Popover",
					this
				);
				this.getView().addDependent(this._oPopover);
			}

			this._oPopover.openBy(oEvent.getSource());
		},
		fn_OPENF4: function() {

			if (!this._oF4Dialog) {

				this._oF4Dialog = sap.ui.xmlfragment(
					this.getView().getId(),
					"MDM_QIR.Fragments.F4Help",
					this
				);

				this.getView().addDependent(this._oF4Dialog);
			}

			this._oF4Dialog.open();
		},

		fn_f4DialogAfterOpen: function() {
			this.byId("id_searchf4").focus();
		},

		fn_closefromto: function() {

			var oSearch = this.byId("id_searchf4");

			if (oSearch) {
				oSearch.setValue("");
			} else {
				console.log("SearchField not found");
			}

			if (this._oF4Dialog) {

				var oTable = this.byId("idF4Table");
				var oBinding = oTable.getBinding("rows");

				if (oBinding) {
					oBinding.filter([]); // reset filter
				}

				this._oF4Dialog.close();
				this._oF4Dialog.destroy();
				this._oF4Dialog = null;
			}

			// var oF4Model = this.getView().getModel("JM_F4Help");
			// if (oF4Model) {
			// 	oF4Model.setData(null);
			// 	oF4Model.destroy();
			// }

			// this._oF4Dialog.close();
		},
		fnClearPress: function() {

			this._openConfirmDialog(
				i18n.getText("Confirmation"),
				i18n.getText("ClearFieldsConfirm"),
				this.fn_clearFields.bind(this)
			);

		},
		fn_clearFields: function() {

			this.byId("SID_QIR_MATNR").setValue("");
			this.byId("SID_QIR_REVLV").setValue("");
			this.byId("SID_QIR_LIFNR").setValue("");
			this.byId("SID_QIR_WERKS").setValue("");
			this.byId("SID_QIR_LIFNRDES").setValue("");
			this.byId("SID_QIR_WERKSDES").setValue("");
			this.byId("SID_QIR_MATNRDES").setValue("");
			this.byId("idVariantCombo").setSelectedKey(null);
			this._selectedVariantName = 'Select Variant';
			this.byId("SID_QIR_MATNR").setValue("~");
			this.fn_search();
			this.byId("SID_QIR_MATNR").setValue("");
			var oText = this.byId("id_countText");
			if (oText) {
				oText.setText("(" + 0 + ")");
			}
		},

		fn_liveDataFetch: function(oEvent) {
			var that = this;

			// clearTimeout(this._liveTimer);
			var oControl = oEvent.getSource();
			if (oControl && oControl.setValueState) {
				oControl.setValueState(sap.ui.core.ValueState.None);
				oControl.setValueStateText("");
			}
			// this._liveTimer = setTimeout(function() {
			var oInput = oEvent.getSource();
			console.log("For Livechange", oInput);
			var sValue = oEvent.getParameter("value").toUpperCase();
			var sInputId = oInput.getId().split("--").pop();
			var sType = oInput.getType();
			if (sType === "Number") {
				var sCleanValue = sValue.replace(/[^0-9]/g, "");

				if (sValue !== sCleanValue) {
					ErrorHandler.showCustomSnackbar(
						"Special characters are not allowed. Only numbers are permitted.",
						"Error",
						this
					);
					oInput.setValue("");
					return;
				}

				// ✔ Set cleaned value
				oInput.setValue(sCleanValue);
				that.fn_livelengthset(that, sInputId, sValue);
			} else {
				oInput.setValue(sValue);
			}
			if (!sValue) {
				that.byId(sInputId + "DES").setValue("");
				return;
			}

			if (sInputId !== "ID_QIR_ICV2_VORLABN") {
				that.fnReadf4Cache(sInputId, sValue);
			}
			// }, 300); // delay
			that.fnFieldChange(oEvent);
		},
		fn_liveDateChange: function(oEvent) {

			var oSource = oEvent.getSource();
			var sNewValue = oSource.getValue();
			var sFieldId = oSource.getId().split("--").pop();

			var oFieldModel = this.getView().getModel("JM_FieldModel");
			var aFieldValues = oFieldModel.getProperty("/fieldvalues") || [];

			var oMatchedField = aFieldValues.find(function(item) {
				return item.FnmId === sFieldId;
			});

			if (!oMatchedField) {
				return;
			}

			var sOldValue = oMatchedField.FnValue || "";

			// format dates
			sOldValue = this.fn_formatDate(sOldValue);
			sNewValue = this.fn_formatDate(sNewValue);

			if (sOldValue === sNewValue) {
				this.fn_removeFromChangeLog(sFieldId);
				return;
			}

			var oChangeLogModel = this.getView().getModel("JM_ChangeLog");
			var aChangeLog = oChangeLogModel.getProperty("/") || [];

			var iIndex = aChangeLog.findIndex(function(item) {
				return item.FieldId === sFieldId;
			});

			var oChangeEntry = {
				FieldId: sFieldId,
				View: oMatchedField.Vwnm,
				FieldName: oMatchedField.FmmDes,
				OldValue: this.fn_formatDate(sOldValue),
				NewValue: this.fn_formatDate(sNewValue),
				ChangedBy: this.userName
			};

			if (iIndex > -1) {
				aChangeLog[iIndex] = oChangeEntry;
			} else {
				aChangeLog.push(oChangeEntry);
			}

			oChangeLogModel.setProperty("/", aChangeLog);
		},

		fn_formatDate: function(sDate) {

			if (!sDate) {
				return "";
			}

			// YYYYMMDD
			if (typeof sDate === "string" && sDate.length === 8) {

				return sDate.substring(6, 8) + "-" +
					sDate.substring(4, 6) + "-" +
					sDate.substring(0, 4);
			}

			return sDate;
		},
		fn_clearSingleFieldError: function(oEvent) {
			var oControl = oEvent.getSource();

			if (oControl && oControl.setValueState) {
				oControl.setValueState(sap.ui.core.ValueState.None);
				oControl.setValueStateText("");
			}
			this.fn_liveDateChange(oEvent);
			var oMsgModel = this.getView().getModel("ValidationMsgModel");
			if (!oMsgModel) {
				return;
			}

			var aItems = oMsgModel.getProperty("/items") || [];
			var sFieldId = oControl.data("fieldId") || "";
			var oCtx = oControl.getBindingContext();
			var sRowNo = "";

			if (oCtx && oCtx.getPath) {
				var sPath = oCtx.getPath();
				var aParts = sPath.split("/");
				sRowNo = aParts[aParts.length - 1];
			}

			aItems = aItems.filter(function(oItem) {
				if (oItem.RowNo !== undefined && oItem.RowNo !== "") {
					return !(oItem.FieldId === sFieldId && String(oItem.RowNo) === String(sRowNo));
				}
				return oItem.FieldId !== sFieldId;
			});

			oMsgModel.setProperty("/items", aItems);

			if (this._oValidationDialog && this._oValidationDialog.isOpen() && aItems.length === 0) {
				this._oValidationDialog.close();
			}

		},
		fn_matnrsearch: function(oEvent) {

			var sValue = oEvent.getParameter("newValue");

			var oTable = this.byId("idF4Table");
			var oBinding = oTable.getBinding("rows");

			if (!oBinding) {
				return;
			}

			var aFilters = [];

			if (sValue) {
				aFilters.push(new sap.ui.model.Filter({
					filters: [
						new sap.ui.model.Filter("Value1", sap.ui.model.FilterOperator.Contains, sValue),
						new sap.ui.model.Filter("Value2", sap.ui.model.FilterOperator.Contains, sValue)
					],
					and: false // OR condition
				}));
			}

			oBinding.filter(aFilters);
		},
		fnReadf4Cache: function(vId, vValue) {

			var that = this;

			var commonSearchHelpIds = [
				"ID_QIR_ICV1_NOINSP",
				"ID_QIR_ICV3_CERTCONTROL"
			];

			var updateDesc = function(results) {

				var isDomainField = commonSearchHelpIds.includes(vId);

				var match = results.find(function(item) {

					var sItem = "";

					if (isDomainField) {
						sItem = (item.DomvalueL || "").toString();
					} else if (vId === "ID_QIR_ICV2_VARIABNAHM") {
						sItem = (item.Value3 || "").toString();
					} else {
						sItem = (item.Value1 || "").toString().replace(/^0+/, "");
					}
					var sValue;
					if (vId !== "ID_QIR_ICV2_VARIABNAHM") {
						sValue = (vValue || "").toString().replace(/^0+/, "");
					} else {
						sValue = vValue;
					}

					return sItem === sValue;
				});

				if (match) {

					if (isDomainField) {
						that.byId(vId + "DES").setValue(match.Ddtext || "");
					} else if (vId === "ID_QIR_ICV2_VARIABNAHM") {
						that.byId(vId + "DES").setValue(match.Value4 || "");
					} else {
						that.byId(vId + "DES").setValue(match.Value2 || "");
					}

				} else {
					that.byId(vId + "DES").setValue("");
				}
			};

			if (this.f4Cache[vId]) {

				updateDesc(this.f4Cache[vId]);

			} else {

				this.f4descriptionGet(vId, function(results) {

					that.f4Cache[vId] = results;
					updateDesc(results);

				});

			}

		},

		f4descriptionGet: function(vId, fnCallback) {

			var commonSearchHelpIds = [
				"ID_QIR_ICV1_NOINSP",
				"ID_QIR_ICV3_CERTCONTROL"
			];

			var oModel = this.getOwnerComponent().getModel("JM_Config");
			var process = vId[0];
			var F4Type = "P";

			if (commonSearchHelpIds.includes(vId)) {
				process = "X";
				F4Type = "F";
			} else {
				if (process === 'I') {
					process = 'A';
				} else if (process === 'D') {
					process = 'D';
				} else if (process === 'S') {
					process = 'S';
				} else {
					process = 'X';
				}
			}
			var oPayload = {
				FieldId: vId,
				F4Type: F4Type,
				Process: process,
				NavSerchResult: []
			};
			var that = this;

			oModel.create("/SearchHelpSet", oPayload, {

				success: function(oData) {

					if (fnCallback) {
						fnCallback(oData.NavSerchResult.results);
					}

				},

				error: function(oResponse) {

					var sMessage = ErrorHandler.parseODataError(oResponse, this);
					ErrorHandler.showCustomSnackbar(sMessage, "Error", that);

				}

			});

		},
		fn_SelectionChange: function(oEvent) {

			var oItem = oEvent.getParameter("listItem");
			var sTarget = oItem.data("target");
			var oList = this.byId("id_list");

			if (sTarget === "Ticket") {
				busyDialog.open();

				var aMasterIds = ["Q"];

				var oManifest = this.getOwnerComponent().getManifest();
				var sSemanticObject = oManifest["sap.app"].crossNavigation.inbounds.intent1.semanticObject;
				var sAction = oManifest["sap.app"].crossNavigation.inbounds.intent1.action;
				var sViewName = this.getView().getViewName();
				var sCurrentPage = sViewName.split(".").pop();
				var RouteList = oManifest["sap.ui5"].routing.routes;
				var CurrentPageDetails = RouteList.find(function(item) {
					return item.name = sCurrentPage;
				});
				var isHavePattern = !!CurrentPageDetails.pattern;

				if (sap.ushell.Container) {
					var oCrossAppNav;
					oCrossAppNav = sap.ushell.Container.getService("CrossApplicationNavigation");
					oCrossAppNav.toExternal({
						target: {
							semanticObject: "ZMDM_TICKET",
							action: "display"
						},
						params: {
							masterId: aMasterIds,
							SemObject: sSemanticObject,
							Action: sAction,
							AppSpecificRoute: isHavePattern ? sCurrentPage : ""
						}
					});
				} else {

					var aParts = window.location.pathname.split("/");
					var sBspApp = "";

					var iSapPos = aParts.lastIndexOf("sap");
					if (iSapPos > -1 && aParts.length > iSapPos + 1) {
						sBspApp = aParts[iSapPos + 1];
					}

					var sUrl = "http://hd1sap.exalca.com:8000" +
						"/sap/bc/ui5_ui5/sap/zmdm_ticket/index.html" +
						"?sap-client=300" +
						"&sap-ui-language=EN" +
						"&sap-ui-xx-devmode=true" +
						"&Ids=" + encodeURIComponent(aMasterIds) +
						"&App=" + encodeURIComponent(sBspApp);

					sap.m.URLHelper.redirect(sUrl, false);
				}
				busyDialog.close();
				return;
			}

			if (!sTarget) {
				return;
			}
			var oModel = this.getView().getModel("viewState");

			var bRunning = false;

			if (oModel) {
				bRunning = oModel.getProperty("/processRunning");
			}

			var sHash = window.location.hash;

			if (sHash.includes("Initiator") || sHash.includes("KeyData") || sHash.includes("MassCreate") || sHash.includes("MassChange")) {

				ErrorHandler.showCustomSnackbar(
					"You cannot navigate to another screen while the process is in progress",
					"Warning",
					this
				);
				return;
			}

			if (bRunning) {

				if (oList) {
					oList.removeSelections(true);
				}

				return;
			}

			if (oList) {
				oList.removeSelections(true);
			}

			this.getOwnerComponent()
				.getRouter()
				.navTo(sTarget, {}, true);
		},
		_openConfirmDialog: function(sTitle, sMessage, fnYes, fnNo) {

			if (!this._oConfirmDialog) {
				this._oConfirmDialog = sap.ui.xmlfragment(
					this.getView().getId(),
					"MDM_QIR.Fragments.Confirmation",
					this
				);
				this.getView().addDependent(this._oConfirmDialog);
			}

			this._confirmYes = fnYes;
			this._confirmNo = fnNo;

			var oModel = new sap.ui.model.json.JSONModel({
				title: sTitle,
				message: sMessage
			});

			this._oConfirmDialog.setModel(oModel, "confirmModel");

			this._oConfirmDialog.open();
		},
		onConfirmSubmit: function() {

			if (this._oConfirmDialog) {
				this._oConfirmDialog.close();
			}

			if (this._confirmYes) {
				this._confirmYes();
			}

			this._confirmYes = null;
			this._confirmNo = null;
		},

		onConfirmCancel: function() {

			if (this._oConfirmDialog) {
				this._oConfirmDialog.close();
			}

			if (this._confirmNo) {
				this._confirmNo();
			}

			this._confirmYes = null;
			this._confirmNo = null;
		},
		fn_NavBack: function() {

			var viewStateModel = this.getOwnerComponent().getModel("JM_ViewStateModel");
			var fromKeydata = viewStateModel.getProperty("/fromKeyData");

			this._openConfirmDialog(
				"Confirmation",
				"Are you sure you want to exit? You have unsaved changes that will be lost.",
				function(bConfirmed) {

					if (!bConfirmed) {
						return;
					}

					try {

						this.fn_clearFieldData();

						var oModel = this.getOwnerComponent().getModel("JM_ContextModel");
						if (oModel) {
							oModel.setData({});
						}

						// var vViewstateModel = new sap.ui.model.json.JSONModel({
						// 	fromDashboard: false,
						// 	fromUWL: false,
						// 	fromKeyData: false,
						// 	fromInitiator: true
						// });
						// this.getOwnerComponent().setModel(vViewstateModel, "JM_ViewStateModel");

						var oContainer = this.byId("id_comments");
						var commentBox = this.byId("id_textarea");

						if (commentBox) {
							commentBox.setValue("");
						}

						if (oContainer) {
							oContainer.destroyItems();
						}

						if (fromKeydata) {
							var vViewstateModel = new sap.ui.model.json.JSONModel({
								fromDashboard: false,
								fromUWL: false,
								fromKeyData: false,
								fromInitiator: true
							});
							this.getOwnerComponent().setModel(vViewstateModel, "JM_ViewStateModel");
							this.getOwnerComponent()
								.getRouter()
								.navTo("KeyData", {}, true);
						} else {
							var viewModel = this.getOwnerComponent().getModel("JM_ViewStateModel");
							var fromUWL = viewModel.getProperty("/fromUWL");
							var fromDB = viewModel.getProperty("/fromDashboard");
							if (fromUWL) {
								this.getOwnerComponent()
									.getRouter()
									.navTo("UWL", {}, true);
							} else if (fromDB) {
								this.getOwnerComponent()
									.getRouter()
									.navTo("Dashboard", {}, true);
							} else {
								this.getOwnerComponent()
									.getRouter()
									.navTo("Search", {}, true);

							}
						}

					} catch (e) {
						console.error("NavBack Error:", e);
					}

				}.bind(this)
			);
		},
		fn_clearFieldData: function() {

			var oView = this.getView();

			this.getView().byId("container").destroyItems(true);

			oView.findAggregatedObjects(true, function(oControl) {

				var sId = oControl.getId();

				if (sId && sId.includes("ID_QIR_")) {

					if (oControl.setValue) {
						oControl.setValue("");
					}

					if (oControl.setSelected) {
						oControl.setSelected(false);
					}

				}

			});

			var oAttachModel = oView.getModel("JM_DocTypeModel");
			if (oAttachModel) {
				oAttachModel.setData(null);
			}
			this.byId("fileUploader").clear();
			var fieldModel = oView.getModel("JM_FieldModel");
			if (fieldModel) {
				fieldModel.setData(null);
			}

			var oContainer = this.byId("id_comments");
			var commentBox = this.byId("id_textarea");
			commentBox.setValue("");
			oContainer.destroyItems();
		}
	});

});