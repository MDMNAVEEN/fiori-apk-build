sap.ui.define([
	"MDM_QIR/controller/BaseController",
	"MDM_QIR/controller/ErrorHandler",
	"MDM_QIR/controller/DynamicFieldHandler",
	"MDM_QIR/Formatter/formatter",
	"sap/m/VBox",
	"sap/m/HBox",
	"sap/m/Panel",
	"sap/ui/layout/Grid"
], function(BaseController, ErrorHandler, DynamicFieldHandler, formatter) {
	"use strict";
	var gbusyDialog = new sap.m.BusyDialog();
	var i18n;
	return BaseController.extend("MDM_QIR.controller.Initiator", {
		formatter: formatter,
		onInit: function() {
			BaseController.prototype.onInit.apply(this, arguments);

			this.f4Cache = {};
			var oConfigModel = this.getOwnerComponent().getModel("JM_Config");
			var oJsonModel = this.getOwnerComponent().getModel("JM_UserModel");

			var that = this;
			oConfigModel.read("/UsernameSet", {
				success: function(oData) {
					oJsonModel.setData(oData.results);
					that.userName = oData.results[0].Uname;
					that.getOwnerComponent().setModel(oJsonModel, "JM_UserModel");
				},
				error: function() {
					ErrorHandler.showCustomSnackbar(i18n.getText("userName_fetch_err"), "Error", that);
				}
			});
			// Attach router
			var oRouter = this.getOwnerComponent().getRouter();
			oRouter.getRoute("Initiator").attachPatternMatched(this.fn_RouteMatched, this);
		},
		fn_RouteMatched: function(oEvent) {

			this.fn_clearFieldData();

			this._clearInitiatorData();

			var oView = this.getView();

			var sRoute = oEvent.getParameter("name");

			if (sRoute !== "Initiator") {
				this.fn_clearFields();
			}
			var oMessageModel = new sap.ui.model.json.JSONModel({
				messages: []
			});
			this.getView().setModel(oMessageModel, "JM_MsgModel");

			var panelModel = new sap.ui.model.json.JSONModel({
				// step1: true,
				// step2: true,
				// step3: true,
				// step4: true
			});
			oView.setModel(panelModel, "JM_panelModel");

			// Image Model
			var vPathImage = jQuery.sap.getModulePath("MDM_QIR") + "/Images/";
			oView.setModel(new sap.ui.model.json.JSONModel({
				path: vPathImage
			}), "JM_ImageModel");

			// i18n
			i18n = this.getOwnerComponent().getModel("i18n").getResourceBundle();

			// Header + F4
			oView.setModel(new sap.ui.model.json.JSONModel({
				col1: "",
				col2: ""
			}), "F4Header");
			oView.setModel(new sap.ui.model.json.JSONModel({
				data: []
			}), "JM_F4Help");

			// Doc Type
			oView.setModel(new sap.ui.model.json.JSONModel({
				List: []
			}), "JM_DocTypeModel");

			// Upload Model
			oView.setModel(new sap.ui.model.json.JSONModel({
				uploadedFileName: ""
			}), "JM_UploadedFile");

			// Attachment Model
			oView.setModel(new sap.ui.model.json.JSONModel({
				data: []
			}), "JM_Model");

			// Field Model
			oView.setModel(new sap.ui.model.json.JSONModel({
				data: []
			}), "JM_FieldModel");

			// Variant Model
			oView.setModel(new sap.ui.model.json.JSONModel({
				ComboBoxvariants: [{
					VariantName: "VAR1"
				}, {
					VariantName: "VAR2"
				}]
			}), "JM_combo");

			//Added For Change Log 
			var oChangeLogModel = new sap.ui.model.json.JSONModel([]);
			this.getView().setModel(oChangeLogModel, "JM_ChangeLog");

			var contextModel = this.getOwnerComponent().getModel("JM_ContextModel");
			var viewStateModel = this.getOwnerComponent().getModel("JM_ViewStateModel");

			if (!viewStateModel) {
				this.getOwnerComponent().getRouter().navTo("Search");
				return;
			}

			var fromModel = new sap.ui.model.json.JSONModel({
				fromUWL: viewStateModel ? viewStateModel.getProperty("/fromUWL") : false,
				fromDashboard: viewStateModel ? viewStateModel.getProperty("/fromDashboard") : false,
				fromKeydata: viewStateModel ? viewStateModel.getProperty("/fromKeyData") : false
			});

			this.vTransid = contextModel.getProperty("/Transid");
			this.vAppId = contextModel.getProperty("/Appid");
			if (fromModel.getProperty("/fromUWL")) {
				this.vWorkItemid = contextModel.getProperty("/WiId");
			} else if (fromModel.getProperty("/fromDashboard")) {
				this.vProgress = contextModel.getProperty("/Progress");
			} else {
				this.vWorkItemid = "";
			}
			this.vTypeLevel = contextModel.getProperty("/TypeLevel");
			this.SendBack = contextModel.getProperty("/SendBack");

			var levelModel = new sap.ui.model.json.JSONModel({
				level: this.vTypeLevel || "I",
				sendback: this.SendBack,
				AppId: "" // Added for change log functionality
			});

			oView.setModel(levelModel, "JM_LevelModel");
			oView.setModel(fromModel, "JM_FromModel");
			console.log("From_Model", fromModel);
			console.log("Context Model", contextModel);
			console.log("view_Model", viewStateModel);
			console.log("Level_Model", levelModel);

			this._updateActiveTabByIndicator(levelModel.getProperty("/level"));
			this.fn_getInputFields(levelModel.getProperty("/level"), this.vTransid, fromModel.getProperty("/fromUWL"), fromModel.getProperty(
				"/fromKeydata"), fromModel.getProperty("/fromDashboard"));
			this.fn_updateheading(this.vTransid, this.vAppId, this.vTypeLevel);
			setTimeout(function() {
				var oVBox = this.byId("id_top");

				if (oVBox) {
					var oDomRef = oVBox.getDomRef();

					if (oDomRef) {
						oDomRef.scrollIntoView({
							behavior: "smooth",
							block: "start"
						});
					}
				}
			}.bind(this), 200);
			// var that = this;
			// setTimeout(function() {
			// 	that._isRouteProcessing = false;
			// }, 500);
			var that = this;
			setTimeout(function() {
				gbusyDialog.open();
				if (contextModel.getProperty("/Appid") === "QIRX") {
					that.fnChangelog();
					gbusyDialog.close();
				}
				gbusyDialog.close();
			}, 500);
			gbusyDialog.close();
		},
		fn_updateheading: function(vTransid, vAppid, vTypLvl) {
			var heading1;
			var heading2;
			var level;
			var process;
			if (vAppid === "QIRC") {
				process = "Creation";
			} else if (vAppid === "QIRX") {
				process = "Change";
			}
			if (vTypLvl === "I") {
				level = "";
			} else if (vTypLvl === "R") {
				level = "Reviewer";
			} else if (vTypLvl === "A") {
				level = "Approver";
			}
			if (vTransid || vAppid || vTypLvl) {
				heading1 = 'QIR Master : ';
				if (level !== "" || level !== undefined) {
					heading2 = process + " : " + level + " - " + vTransid;
				} else {
					heading2 = process;
				}
			}
			if (heading1 || heading2) {
				this.byId("id_heading1").setText(heading1);
				this.byId("id_heading2").setText(heading2);
			} else {
				this.byId("id_heading1").setText(" Master Data Workbench ");
				this.byId("id_heading2").setText(" - QIR Master");
			}
		},
		_clearInitiatorData: function() {

			var oView = this.getView();

			// clear models
			if (oView.getModel("JM_Model")) {
				oView.getModel("JM_Model").setData(null);
			}

			if (oView.getModel("JM_FieldModel")) {
				oView.getModel("JM_FieldModel").setData(null);
			}

			// clear inputs
			[
				"SID_QIR_MATNR",
				"SID_QIR_LIFNR",
				"SID_QIR_WERKS",
				"SID_QIR_MATNRDES",
				"SID_QIR_LIFNRDES",
				"SID_QIR_WERKSDES"
			].forEach(function(id) {
				var oCtrl = oView.byId(id);
				if (oCtrl) {
					oCtrl.setValue("");
				}
			});

			this.getView().byId("id_comments").destroyItems();

		},
		_updateActiveTabByIndicator: function(sIndicator) {
			var aTabIds = [
				"idTabInitiator",
				"idTabReviewer",
				"idTabApprover"
			];

			aTabIds.forEach(function(sId) {
				var oTab = this.byId(sId);
				if (oTab) {
					oTab.removeStyleClass("activeTab");
				}
			}.bind(this));

			var sActiveTabId = "idTabInitiator";

			if (sIndicator === "R") {
				sActiveTabId = "idTabReviewer";
			} else if (sIndicator === "A") {
				sActiveTabId = "idTabApprover";
			} else {
				sActiveTabId = "idTabInitiator";
			}

			var oActiveTab = this.byId(sActiveTabId);
			if (oActiveTab) {
				oActiveTab.addStyleClass("activeTab");
			}
		},
		fn_togglePanel: function(sPanelKey) {

			var oPanelModel = this.getView().getModel("JM_panelModel");

			var bState = oPanelModel.getProperty("/" + sPanelKey);

			oPanelModel.setProperty("/" + sPanelKey, !bState);
			this.fn_checkpanelstatus();
		},
		fn_checkpanelstatus: function() {
			var oPanelModel = this.getView().getModel("JM_panelModel");
		},
		fn_collapse: function(oEvent) {

			var oBtn = oEvent.getSource();
			var oPanelModel = this.getView().getModel("JM_panelModel");
			var oData = oPanelModel.getData();

			var bAnyExpanded = Object.values(oData).some(function(val) {
				return val === true;
			});

			Object.keys(oData).forEach(function(key) {
				oPanelModel.setProperty("/" + key, !bAnyExpanded);
			});

			oBtn.setText(bAnyExpanded ? "Expand All" : "Collapse All");
		},
		fn_getInputFields: function(vInd, Tid, vFromUWL, vFromKeydata, vDashboard) {

			if ((vInd === "" || vInd === undefined || vInd === 'I') && (!Tid || Tid === undefined) && vFromKeydata) {
				vInd = "I";
			} else if (Tid && vInd === "I" && this.SendBack === 'X') {
				vInd = "S";
			} else if (vInd === 'A' || vInd === 'R') {
				if (vInd === 'A') {
					vInd = 'A';
				} else {
					vInd = 'R';
				}
			} else {
				vInd = "D";
			}

			var ItemModel = this.getOwnerComponent().getModel("JM_ItemsModel");
			console.log("init items model", ItemModel);
			if (vInd === "I" && !ItemModel) {
				return;
			}
			var oPayload = {};
			if (ItemModel && !Tid) {
				var oModelData = ItemModel.getData();
				var vAppId = "QIRC";
				vAppId = oModelData[6] || "QIRC";
				var vMsgType = oModelData[7];
				var levelModel = this.getView().getModel("JM_LevelModel");
				if (levelModel) {
					levelModel.setProperty("/AppId", vAppId);
				}
				this.getView().byId('SID_QIR_MATNR').setValue(oModelData[0]);
				this.getView().byId('SID_QIR_LIFNR').setValue(oModelData[1]);
				this.getView().byId('SID_QIR_WERKS').setValue(oModelData[2]);
				this.getView().byId('SID_QIR_MATNRDES').setValue(oModelData[3]);
				this.getView().byId('SID_QIR_LIFNRDES').setValue(oModelData[4]);
				this.getView().byId('SID_QIR_WERKSDES').setValue(oModelData[5]);
				if (vMsgType === 'C' && vAppId === "QIRC") {
					oPayload = {
						AppId: "QIRC",
						Ind: vInd,
						MsgType: vMsgType,
						Werks: oModelData[2],
						Vendor: oModelData[1],
						Matnr: oModelData[0],
						NavGetInit: [],
						NavGetInitVal: [],
						NavRules: []
					};
				} else if (vAppId === "QIRC") {
					oPayload = {
						AppId: "QIRC",
						Ind: vInd,
						Werks: oModelData[2],
						Matnr: oModelData[0],
						NavGetInit: [],
						NavRules: []
					};
				} else if (vAppId === "QIRX") {
					oPayload = {
						AppId: "QIRX",
						Ind: vInd,
						Werks: oModelData[2],
						Vendor: oModelData[1],
						Matnr: oModelData[0],
						NavGetInit: [],
						NavGetInitVal: [],
						NavRules: []
					};
				}

				if (vMsgType === "C") {
					var changeModelData = this.getOwnerComponent().getModel("JM_ChangeItemsModel").getData();
					this.getView().byId('SID_QIR_MATNR').setValue(changeModelData[0]);
					this.getView().byId('SID_QIR_LIFNR').setValue(changeModelData[1]);
					this.getView().byId('SID_QIR_WERKS').setValue(changeModelData[2]);
				}

			} else {
				var contextModel = this.getOwnerComponent().getModel("JM_ContextModel");
				var sAppId = "QIRC";
				if (contextModel) {
					var contextData = contextModel.getData();
					if (contextData) {
						sAppId = contextData.Appid;
					}
				}
				if (sAppId === "QIRC") {
					oPayload = {
						AppId: "QIRC",
						TransId: Tid,
						Ind: vInd,
						Werks: "",
						NavGetInit: [],
						NavGetInitVal: [],
						NavKeyValues: [],
						NavAttachmentRead: [],
						NavCommentsRead: []
					};
				} else if (sAppId === "QIRX") {
					oPayload = {
						AppId: "QIRX",
						TransId: Tid,
						Ind: vInd,
						Werks: "",
						NavGetInit: [],
						NavGetInitVal: [],
						NavKeyValues: [],
						NavAttachmentRead: [],
						NavCommentsRead: [],
						NavChangeLogRead: []
					};
				}
			}

			var oModel = this.getOwnerComponent().getModel();
			var oFieldModel = this.getView().getModel("JM_FieldModel");

			var that = this;

			console.log(oPayload);
			oModel.setUseBatch(false);
			oModel.create("/KeyDataSet", oPayload, {
				success: function(oData) {
					console.log("API TRIGGERED");
					console.log("Final Value with comment attachment", oData);
					if (oData.NavGetInit) {
						oFieldModel.setProperty("/data", oData.NavGetInit.results);
					}
					var oAttachmentData = oData.NavAttachmentRead.results;

					that.fn_SetAttachmentData(oAttachmentData);
					var aComments = oData.NavCommentsRead.results;

					if (aComments) {
						aComments.forEach(function(item) {

							var sDateTime = item.Date + " - " + item.Time;

							that.fnCreateCommentUI({
								User: item.CreatedBy,
								Text: item.Comments,
								DateTime: item.CrtdTime,
								Action: item.ActionText || "Added a Comment"
							});

						});
					}
					// setTimeout(function() {
					that.fn_fetchfields();
					// }, 200);
					if (oData.NavGetInitVal) {

						console.log(oData.NavGetInitVal.results);
						oFieldModel.setProperty("/fieldvalues", oData.NavGetInitVal.results);
						console.log("keyvalues", oData.NavKeyValues);
						oFieldModel.setProperty("/keyvalues", oData.NavKeyValues.results);
						oFieldModel.setProperty("/keyvalues", oData.NavRules.results);
						setTimeout(function() {
							that.fn_getFieldValues(oData.NavGetInitVal.results, oData.NavKeyValues.results, oData.NavRules.results);
						}, 500);
						// oFieldModel.setProperty("/fieldvalues", oData.NavGetInitVal.results);
					}

					if (oData.NavChangeLogRead) {
						console.log("changelog value", oData.NavChangeLogRead);
						setTimeout(function() {
							that.fn_getLogValues(oData.NavChangeLogRead);
						}, 500);
					}

					// ErrorHandler.showCustomSnackbar(
					// 	i18n.getText("initiator_fetch_success"),
					// 	"success"
					// );
				},

				error: function(err) {
					ErrorHandler.showCustomSnackbar(
						i18n.getText("initiator_fetch_err"),
						"Error",
						that
					);
				}
			});
		},
		fn_fetchfields: function() {
			var oContainer = this.getView().byId("container");
			if (oContainer) {
				oContainer.destroyItems();
			}
			var oFieldModel = this.getView().getModel("JM_FieldModel");
			var oGrouped = {};
			var data = oFieldModel.getProperty("/data");
			if (data) {
				for (var i = 0; i < data.length; i++) {
					if (!oGrouped[data[i].Vwnm]) {
						oGrouped[data[i].Vwnm] = [];
					}

					oGrouped[data[i].Vwnm].push(data[i]);

				}
			}
			var aViews = Object.keys(oGrouped);
			aViews.forEach(function(ViewName) {
				var aViewData = oGrouped[ViewName];
				this.fn_build(ViewName, aViewData);
			}.bind(this));
			console.log(oGrouped);
		},
		fn_build: function(vName, viewData) {
			var sPanelKey = "panel_" + vName.replace(/\s/g, "_");
			var oPanelModel = this.getView().getModel("JM_panelModel");

			var fromModel = this.getView().getModel("JM_FromModel");
			var frmdsh = fromModel.getProperty("/fromDashboard");

			if (oPanelModel.getProperty("/" + sPanelKey) === undefined) {
				oPanelModel.setProperty("/" + sPanelKey, true);
			}

			var oGrouped = {};
			viewData.forEach(function(item) {
				if (!oGrouped[item.Heading]) {
					oGrouped[item.Heading] = [];
				}
				oGrouped[item.Heading].push(item);
			});

			var oVBox = DynamicFieldHandler._createMainVBox();
			var visible = vName === "QUALITY AGREEMENT";
			var oPanel = DynamicFieldHandler._createPanel(this, vName, sPanelKey, visible);
			var oMainGrid = DynamicFieldHandler._createGridFull();

			Object.keys(oGrouped).forEach(function(sHeading) {

				var oSubVBox = DynamicFieldHandler._createVBoxSubView();
				var oHeader = DynamicFieldHandler._createHeaderText(this, sHeading, visible);

				var oGrid = DynamicFieldHandler._createGrid();

				var aFields = oGrouped[sHeading];
				var aTableFields = [];

				for (var i = 0; i < aFields.length; i++) {

					var view = aFields[i];
					var oHBox = DynamicFieldHandler._createInputHBox();

					if (view.TableUi === "X" && view.TypFld === "I") {
						aTableFields.push(view);
						continue;
					}

					if (view.FmmDes === "Rest On" && aFields[i + 1]) {

						var nextView = aFields[i + 1];

						var oMainHBox = new sap.m.HBox({
							width: "100%"
						}).addStyleClass("cl_gap");

						var oLabel1 = new sap.m.Label({
							text: view.FmmDes,
							required: view.Rqr === "X",
							visible: view.HD !== "X",
							width: "100%"
						}).addStyleClass("cl_label");

						var oField1 = DynamicFieldHandler._createMatnrField(
							this,
							view.Rqr === "X",
							view.FnmId,
							view.FmmDes,
							view.HD !== "X",
							"100%", // full inside VBox
							view.FieldFormat,
							view.SearchHelp,
							view.Dsply,
							view.FieldLength
						);

						var oLeftVBox = new sap.m.VBox({
							width: "50%",
							items: [oLabel1, new sap.m.HBox({
								width: "100%",
								alignItems: "Center",
								items: [oField1]
							}).addStyleClass("cl_gap sapUiTinyMarginTop")]
						});

						oMainHBox.addItem(oLeftVBox);

						var oLabel2 = new sap.m.Label({
							text: nextView.FmmDes,
							visible: nextView.HD !== "X",
							width: "100%"
						}).addStyleClass("cl_label");

						var oCheckBox = new sap.m.CheckBox({
							visible: nextView.HD !== "X",
							enabled: nextView.Dsply !== "X",
							id: this.createId(nextView.FnmId)
						}).addStyleClass("cl_checkbox sapUiSizeCompact");

						var oRightVBox = new sap.m.VBox({
							width: "50%",
							items: [
								oLabel2,
								new sap.m.HBox({
									width: "100%",
									alignItems: "Center",
									items: [oCheckBox]
								}).addStyleClass("cl_gap sapUiTinyMarginTop")
							]
						});

						oMainHBox.addItem(oRightVBox);

						var oFieldContainer = new sap.m.VBox({
							items: [oMainHBox],
							layoutData: new sap.ui.layout.GridData({
								span: "L3 M6 S12"
							})
						});

						oGrid.addContent(oFieldContainer);

						i++; // skip next field
						continue;
					}

					if (view.TypFld === "I" && view.TableUi !== "X") {

						var bRequired = view.Rqr === "X";
						var bVisible = view.HD !== "X";
						var width = "";

						var oLabel = new sap.m.Label({
							id: this.createId(view.FnmId + "L"),
							text: view.FmmDes,
							required: bRequired,
							visible: bVisible
						}).addStyleClass("cl_label");

						var display = "";
						if (frmdsh && (this.vProgress === 'Inprogress' || this.vProgress === 'Rejected' ||
								this.vProgress === 'Complete' || this.vProgress === 'SendBack')) {
							display = 'X';
						}

						if (view.TextTable !== "") {

							if (view.FieldSize === "M") {
								width = 40;
							} else if (view.FieldSize === "S") {
								width = 30;
							} else {
								width = 50;
							}

							var deswidth = 100 - width;

							var oField = DynamicFieldHandler._createMatnrField(
								this,
								bRequired,
								view.FnmId,
								view.FmmDes,
								bVisible,
								width + "%",
								view.FieldFormat,
								view.SearchHelp,
								display || view.Dsply,
								view.FieldLength,
								view.RuleValue

							);

							var oDesc = DynamicFieldHandler._createMatdesField(
								deswidth + "%",
								this.createId(view.FnmId + "DES"),
								view.RuleText
							);

							oHBox.addItem(oField);
							oHBox.addItem(oDesc);

						} else {

							var oField = DynamicFieldHandler._createMatnrField(
								this,
								bRequired,
								view.FnmId,
								view.FmmDes,
								bVisible,
								"100%",
								view.FieldFormat,
								view.SearchHelp,
								display || view.Dsply,
								view.FieldLength
							);

							oHBox.addItem(oField);
						}

						var oFieldContainer = new sap.m.VBox({
							items: [oLabel, oHBox]
						});

						oGrid.addContent(oFieldContainer);
					} else if (view.TypFld === "C") {

						var vVisible = view.HD !== "X";

						var oCheckBox = DynamicFieldHandler._createCheckBoxInline(
							this,
							view.FnmId,
							view.FmmDes,
							vVisible,
							view.Dsply
						);

						oHBox.addItem(oCheckBox);

						var oFieldContainer = new sap.m.VBox({
							items: [oHBox]
						});

						oGrid.addContent(oFieldContainer);
					}
				}

				oSubVBox.addItem(oHeader);
				oSubVBox.addItem(oGrid);

				if (aTableFields.length > 0) {

					var sTableModelName = "TABLE_" +
						vName.replace(/\s/g, "_") + "_" +
						sHeading.replace(/\s/g, "_");

					var oTableModel = new sap.ui.model.json.JSONModel({
						fields: aTableFields,
						rows: []
					});

					this.getView().setModel(oTableModel, sTableModelName);

					var oTable = DynamicFieldHandler._createTable(this, sTableModelName);
					oTable.data("tableModel", sTableModelName);

					aTableFields.forEach(function(oField) {
						oTable.addColumn(
							DynamicFieldHandler._createColumn(this, oField, sTableModelName)
						);
					}.bind(this));

					oSubVBox.addItem(oTable);
				}

				oMainGrid.addContent(oSubVBox);

			}.bind(this));

			oPanel.addContent(oMainGrid);
			oVBox.addItem(oPanel);
			this.getView().byId("container").addItem(oVBox);
		},
		fn_addrow: function(oEvent) {

			var oButton = oEvent.getSource();

			var oParent = oButton;

			while (oParent && !oParent.isA("sap.m.Panel")) {
				oParent = oParent.getParent();
			}

			if (!oParent) return;

			var aContent = oParent.getContent();

			aContent.forEach(function(oMainGrid) {

				if (oMainGrid.isA("sap.ui.layout.Grid")) {

					oMainGrid.getContent().forEach(function(oSubVBox) {

						oSubVBox.getItems().forEach(function(oItem) {

							if (oItem.isA("sap.ui.table.Table")) {

								var sModelName = oItem.data("tableModel");
								var oModel = this.getView().getModel(sModelName);

								if (oModel) {

									var aRows = oModel.getProperty("/rows") || [];
									var aFields = oModel.getProperty("/fields") || [];

									if (aRows.length > 0) {

										var oLastRow = aRows[aRows.length - 1];

										var bEmptyRow = aFields.every(function(oField) {

											var vValue = oLastRow[oField.Fnm];

											return vValue === "" ||
												vValue === null ||
												vValue === undefined;
										});

										if (bEmptyRow) {

											ErrorHandler.showCustomSnackbar(
												i18n.getText("please_fill_empty_row"),
												"Error",
												this
											);

											return;
										}
									}

									var oNewRow = {};

									aFields.forEach(function(oField) {
										oNewRow[oField.Fnm] = "";
									});

									aRows.push(oNewRow);

									oModel.setProperty("/rows", aRows);
								}

							}

						}.bind(this));

					}.bind(this));

				}

			}.bind(this));
		},
		fn_delrow: function(oEvent) {

			var oButton = oEvent.getSource();

			var oParent = oButton;

			while (oParent && !oParent.isA("sap.m.Panel")) {
				oParent = oParent.getParent();
			}

			if (!oParent) return;

			var aContent = oParent.getContent();

			aContent.forEach(function(oMainGrid) {

				if (oMainGrid.isA("sap.ui.layout.Grid")) {

					oMainGrid.getContent().forEach(function(oSubVBox) {

						oSubVBox.getItems().forEach(function(oItem) {

							if (oItem.isA("sap.ui.table.Table")) {

								var oTable = oItem;

								// MULTIPLE SELECTED ROWS
								var aSelectedIndices = oTable.getSelectedIndices();

								if (aSelectedIndices.length === 0) {

									ErrorHandler.showCustomSnackbar(
										i18n.getText("Select_Row_Delete"),
										"Error",
										this
									);

									return;
								}

								var sModelName = oTable.data("tableModel");
								var oModel = this.getView().getModel(sModelName);

								var aRows = oModel.getProperty("/rows") || [];

								// DELETE FROM LAST INDEX
								aSelectedIndices.sort(function(a, b) {
									return b - a;
								});

								aSelectedIndices.forEach(function(iIndex) {
									aRows.splice(iIndex, 1);
								});

								oModel.setProperty("/rows", aRows);

								oTable.clearSelection();
							}

						}.bind(this));

					}.bind(this));

				}

			}.bind(this));
		},

		fn_validateAndSubmit: function(oEvent, noconfirmation) {
			var oPayload = this._buildValidationPayload();
			var oModel = this.getOwnerComponent().getModel();
			var that = this;

			this._clearAllFieldErrors();

			oModel.create("/ValidateHeaderSet", oPayload, {
				success: function(oData) {
					var oMessages = that._extractValidationMessages(oData, noconfirmation);

					var bAllSuccess = oMessages.length === 0 || oMessages.every(function(oMsg) {
						return oMsg.MsgType === "S";
					});

					if (bAllSuccess && !noconfirmation) {
						that._openConfirmDialog(
							"Confirmation",
							"Validation successful ? Are you sure want to proceed ?	",
							function(bConfirmed) {
								if (bConfirmed) {
									that.fn_finalSubmit();
								}
							}
						);
					} else {
						that._openValidationMessageFragment(oMessages);
					}
				},
				error: function() {
					ErrorHandler.showCustomSnackbar(i18n.getText("validation_error"), "Error", that);
				}
			});
		},
		_openConfirmDialog: function(title, message, fnCallback) {

			if (!this._oConfirmDialog) {
				this._oConfirmDialog = sap.ui.xmlfragment(
					this.getView().getId(),
					"MDM_QIR.Fragments.Confirmation",
					this
				);

				this.getView().addDependent(this._oConfirmDialog);
			}

			this._confirmCallback = fnCallback;

			var oModel = new sap.ui.model.json.JSONModel({
				title: title,
				message: message
			});

			this._oConfirmDialog.setModel(oModel, "confirmModel");
			this._oConfirmDialog.open();
		},

		onConfirmSubmit: function() {
			if (this._oConfirmDialog) {
				this._oConfirmDialog.close();
			}

			if (this._confirmCallback) {
				this._confirmCallback(true);
				this._confirmCallback = null;
			}
		},

		onConfirmCancel: function() {
			if (this._oConfirmDialog) {
				this._oConfirmDialog.close();
			}

			if (this._confirmCallback) {
				this._confirmCallback(false);
				this._confirmCallback = null;
			}
		},
		_buildValidationPayload: function() {
			var oFieldModel = this.getView().getModel("JM_FieldModel");
			var aMeta = oFieldModel.getProperty("/data") || [];
			var aNavValidate = [];
			var sWerks = this.getView().byId("SID_QIR_WERKS").getValue() || "";
			var iSerial = 1;
			var that = this;

			aMeta.forEach(function(oField) {
				if (
					oField.TypFld === "L" ||
					oField.TypFld === "H" ||
					(oField.TableUi === "X" && oField.TypFld === "I")
				) {
					return;
				}

				var sValue = "";
				var oControl = that.byId(oField.FnmId);
				if (!oControl) {
					oControl = sap.ui.getCore().byId(that.createId(oField.FnmId));
				}

				if (oControl) {
					if (oControl.isA("sap.m.DatePicker")) {
						sValue = oControl.getValue() || "";
					} else if (oControl.isA("sap.m.Input")) {
						sValue = oControl.getValue() || "";
					} else if (oControl.isA("sap.m.CheckBox")) {
						sValue = oControl.getSelected() ? "X" : "";
					} else if (oControl.isA("sap.m.ComboBox")) {
						sValue = oControl.getSelectedKey() || oControl.getValue() || "";
					}
				}

				aNavValidate.push({
					Werks: sWerks,
					FieldId: oField.FnmId || "",
					ViewId: oField.Vwnm || "",
					FieldName: oField.Fnm || "",
					FieldValue: sValue,
					MsgType: "",
					Message: "",
					SerialNo: String(iSerial++)
				});
			});
			this._collectTableValidationRows(aNavValidate, iSerial);

			return {
				Werks: sWerks,
				// AppId: "QIRC",
				NavValHeader: aNavValidate
			};
		},
		_findTableControl: function(sFieldId, sRowNo) {
			var oView = this.getView();
			var aTables = [];

			oView.findAggregatedObjects(true, function(oControl) {
				if (oControl.isA("sap.ui.table.Table")) {
					aTables.push(oControl);
				}
				return false;
			});

			for (var i = 0; i < aTables.length; i++) {
				var oTable = aTables[i];
				var aRows = oTable.getRows();

				if (aRows[Number(sRowNo)]) {
					var aCells = aRows[Number(sRowNo)].getCells();

					for (var j = 0; j < aCells.length; j++) {
						var oCell = aCells[j];
						if (oCell.data("fieldId") === sFieldId) {
							return oCell;
						}
					}
				}
			}

			return null;
		},
		_collectTableValidationRows: function(aNavValidate, iStartSerial) {
			var oView = this.getView();
			var oFieldModel = oView.getModel("JM_FieldModel");
			var aMeta = oFieldModel.getProperty("/data") || [];
			var oGroupedTables = {};
			var iSerial = iStartSerial || 1;
			var sWerks = oView.byId("SID_QIR_WERKS").getValue() || "";

			aMeta.forEach(function(oField) {
				if (oField.TableUi === "X" && oField.TypFld === "I") {
					var sModelName = "TABLE_" +
						(oField.Vwnm || "").replace(/\s/g, "_") + "_" +
						(oField.Heading || "").replace(/\s/g, "_");

					if (!oGroupedTables[sModelName]) {
						oGroupedTables[sModelName] = [];
					}
					oGroupedTables[sModelName].push(oField);
				}
			});

			Object.keys(oGroupedTables).forEach(function(sModelName) {
				var oTableModel = oView.getModel(sModelName);
				if (!oTableModel) {
					return;
				}

				var aRows = oTableModel.getProperty("/rows") || [];
				var aFields = oGroupedTables[sModelName];

				aRows.forEach(function(oRow, iRowIndex) {
					aFields.forEach(function(oField) {
						aNavValidate.push({
							Werks: sWerks,
							FieldId: oField.FnmId || "",
							ViewId: oField.Vwnm || "",
							FieldName: oField.Fnm || "",
							FieldValue: oRow[oField.Fnm] || "",
							MsgType: "",
							Message: "",
							SerialNo: String(iSerial++)
								// RowNo: String(iRowIndex)
						});
					});
				});
			});
		},
		_extractValidationMessages: function(oData, noApply) {
			var aRows = [];

			if (oData.NavValHeader && oData.NavValHeader.results) {
				aRows = oData.NavValHeader.results;
			} else if (oData.NavValHeader && Array.isArray(oData.NavValHeader)) {
				aRows = oData.NavValHeader;
			}

			console.log("error msg", aRows);

			var aMessages = aRows.filter(function(item) {
					return item.MsgType !== "S";
				})
				.map(function(item) {

					var state;
					if (item.MsgType === "E") {
						state = "Error";
					} else if (item.MsgType === "W") {
						state = "Warning";
					}
					if (state === "Warning") {
						console.log("Warning Message", item);
					}
					return {
						type: state,
						title: item.Message,
						fieldId: item.FieldId
					};
				});
			var oMsgModel = new sap.ui.model.json.JSONModel({
				messages: aMessages
			});

			this.getView().setModel(oMsgModel, "JM_MsgModel");
			var that = this;
			aRows.forEach(function(msg) {
				if (!noApply || noApply === undefined) {
					that._applyFieldError(msg, true);
				}
			});
			return aRows.filter(function(oRow) {
				return oRow.Message && oRow.MsgType === "E";
			});

		},
		_openValidationMessageFragment: function(aMessages) {
			var oView = this.getView();
			var oMsgModel = new sap.ui.model.json.JSONModel({
				items: aMessages
			});

			oView.setModel(oMsgModel, "ValidationMsgModel");
		},

		_buildFinalPayload: function() {
			var oFieldModel = this.getView().getModel("JM_FieldModel");
			var aMeta = oFieldModel.getProperty("/data") || [];
			var aNavData = [];
			var that = this;
			var vAppid = 'QIRC';
			if (this.getOwnerComponent().getModel("JM_ItemsModel")) {
				console.log("Items Model", this.getOwnerComponent().getModel("JM_ItemsModel").getData());
				if (this.getOwnerComponent().getModel("JM_ItemsModel").getProperty("/data")) {
					vAppid = this.getOwnerComponent().getModel("JM_ItemsModel").getProperty("/data").AppId || "QIRC";
				} else if (this.getOwnerComponent().getModel("JM_ItemsModel").getData()) {
					vAppid = this.getOwnerComponent().getModel("JM_ItemsModel").getData()[6] || "QIRC";
				}
			} else if (this.getOwnerComponent().getModel("JM_ContextModel")) {
				console.log("Items Context Model", this.getOwnerComponent().getModel("JM_ContextModel").getData());
				if (this.getOwnerComponent().getModel("JM_ContextModel").getData()) {
					vAppid = this.getOwnerComponent().getModel("JM_ContextModel").getData().Appid;
				}
			}
			var sWerks = this.byId("SID_QIR_WERKS").getValue() || "";
			var sMatnr = this.byId("SID_QIR_MATNR").getValue() || "";
			var sRevlv = this.byId("SID_QIR_REVLV").getValue() || "";
			var sVendor = this.byId("SID_QIR_LIFNR").getValue() || "";
			var sAppId = vAppid || "QIRC";
			var sTransId = this.vTransid;
			var sWiId = this.vWorkItemid;
			var sWfparm1 = sWerks;
			var sWfparm2 = "";
			var sWfparm3 = "";
			var sWfparm4 = "";

			aMeta.forEach(function(oField) {

				if (oField.TypFld === "L" || oField.TypFld === "H") {
					return;
				}

				if (oField.TableUi === "X" && oField.TypFld === "I") {
					return;
				}

				var sValue = "";
				var oControl = that.byId(oField.FnmId) || sap.ui.getCore().byId(that.getView().createId(oField.FnmId));
				console.log("final payload ", oControl);

				if (oControl) {
					if (oControl.isA("sap.m.Input")) {
						sValue = oControl.getValue() || "";
					} else if (oControl.isA("sap.m.DatePicker")) {
						sValue = oControl.getValue() || "";
					} else if (oControl.isA("sap.m.CheckBox")) {
						sValue = oControl.getSelected() ? "X" : "";
					} else if (oControl.isA("sap.m.ComboBox")) {
						sValue = oControl.getSelectedKey() || oControl.getValue() || "";
					}
				}

				aNavData.push({
					Werks: sWerks,
					Vwnm: oField.Vwnm || "",
					VwnmId: oField.VwnmId || "",
					VwnmSid: oField.VwnmSid || "",
					Heading: oField.Heading || "",
					Fnm: oField.Fnm || "",
					FmmDes: oField.FmmDes || "",
					FnmId: oField.FnmId || "",
					MdmId: oField.MdmId || "",
					Hd: oField.HD || "",
					Dsply: oField.Dsply || "",
					Rqr: oField.Rqr || "",
					SapTable: oField.SapTable || "",
					TextTable: oField.TextTable || "",
					TableUi: oField.TableUi || "",
					TypFld: oField.TypFld || "",
					SearchHelp: oField.SearchHelp || "",
					FieldLength: oField.FieldLength || "",
					FieldDec: oField.FieldDec || "",
					FieldSize: oField.FieldSize || "",
					TransId: oField.TransId || "",
					FieldFormat: oField.FieldFormat || "",
					FnValue: sValue
				});
			});

			// this._collectFinalTableRows(aNavData);

			return {
				Appid: sAppId,
				Transid: sTransId || "",
				WiId: sWiId || "",
				Wfparm1: sWfparm1,
				Wfparm2: sWfparm2,
				Wfparm3: sWfparm3,
				Wfparm4: sWfparm4,
				Matnr: sMatnr,
				Werks: sWerks,
				Revlv: sRevlv,
				Leiferant: sVendor,
				MsgType: "",
				Message: "",
				Ind: "",
				NavFieldItems: aNavData
			};
		},
		fn_saveasdraftconfirmation: function() {
			var that = this;
			this._openConfirmDialog(
				"Confirmation",
				"Do you want to save your changes as a draft? You can continue later.",
				function(bConfirmed) {
					if (bConfirmed) {
						that.fn_saveasdraft();
					}
				}
			);
		},
		fn_saveasdraft: function() {
			gbusyDialog.open();

			var oPayload = this._buildFinalPayload();
			oPayload.Ind = "D"
			var oDataModel = this.getOwnerComponent().getModel();
			var oModel = this.getView().getModel("JM_DocTypeModel");
			var aData = oModel.getProperty("/List") || [];
			oPayload.NavAttachment = [];

			if (aData.length > 0) {

				aData.forEach(function(item) {

					oPayload.NavAttachment.push({
						"MimeType": item.MimeType,
						"FileSize": item.Size,
						"FileName": item.TagName,
						"Xstring": item.Xstring
					});

				});

			}
			var that = this;
			var vCommentsValue = this.getView().byId("id_textarea").getValue();
			oPayload.NavComment = [];

			if (vCommentsValue) {
				oPayload.NavComment.push({
					"Comments": vCommentsValue
				});
			}

			console.log("Final Payload", oPayload);

			oDataModel.create("/FieldHeaderSet", oPayload, {
				success: function(oData) {
					console.log(oData);
					var oPopupModel = new sap.ui.model.json.JSONModel({
						title: "Confirmation",
						text: oData.Message,
						positiveButton: "OK",
						positiveIcon: that.getView().getModel("JM_ImageModel").getProperty("/path") + "Continue.svg",
						Indicator: "UWL"
					});

					that.getView().setModel(oPopupModel, "JM_Popup");
					if (!that.oSuccessdialog) {
						that.oSuccessdialog = sap.ui.xmlfragment(
							that.getView().getId(),
							"MDM_QIR.Fragments.SucessDialog",
							that
						);
						that.getView().addDependent(that.oSuccessdialog);
					}

					gbusyDialog.close();
					that.oSuccessdialog.open();
					// ErrorHandler.showCustomSnackbar("Data submitted successfully", "success");
				},
				error: function(oError) {
					gbusyDialog.close();
					ErrorHandler.showCustomSnackbar(i18n.getText("Submit_failed"), "Error", that);
				}
			});
		},
		fn_finalSubmit: function() {
			gbusyDialog.open();
			var oModel = this.getView().getModel("JM_DocTypeModel");
			var aData = oModel.getProperty("/List") || [];

			var oPayload = this._buildFinalPayload();

			oPayload.NavAttachment = [];

			if (oPayload.Appid === "QIRX") {
				oPayload.NavChangeLog = [];
				var oChangeLogModel = this.getView().getModel("JM_ChangeLog");
				if (oChangeLogModel) {
					var changeData = oChangeLogModel.getData();
					console.log("ChangeModel Data", changeData);
					if (changeData.length > 0) {

						changeData.forEach(function(item) {

							oPayload.NavChangeLog.push({
								"FieldId": item.FieldId,
								"OldValue": item.OldValue,
								"NewValue": item.NewValue,
								"ChangedBy": item.ChangedBy,
								"Viewnm": item.View,
								"Matnr": item.Matnr,
								"Vendor": item.Vendor,
								"Plant": item.Plant
							});

						});

					}
				}
			}

			if (aData.length > 0) {

				aData.forEach(function(item) {

					oPayload.NavAttachment.push({
						"MimeType": item.MimeType,
						"FileSize": item.Size,
						"FileName": item.TagName,
						"Xstring": item.Xstring
					});

				});

			}

			oPayload.Ind = "X";
			var oModel = this.getOwnerComponent().getModel();
			var that = this;
			var vCommentsValue = this.getView().byId("id_textarea").getValue();
			oPayload.NavComment = [];

			if (vCommentsValue) {
				oPayload.NavComment.push({
					"Comments": vCommentsValue
				});
			}

			console.log("Final Payload", oPayload);

			oModel.create("/FieldHeaderSet", oPayload, {
				success: function(oData) {
					console.log("FINAL SUBMIT", oData);
					// ErrorHandler.showCustomSnackbar("Data submitted successfully", "success");
					if (oData.MsgType === "S") {

						var oPopupModel = new sap.ui.model.json.JSONModel({
							title: "Confirmation",
							text: oData.Message,
							positiveButton: "OK",
							positiveIcon: that.getView().getModel("JM_ImageModel").getProperty("/path") + "Continue.svg",
							Indicator: "UWL"
						});

						that.getView().setModel(oPopupModel, "JM_Popup");

						if (!that.oSuccessdialog) {
							that.oSuccessdialog = sap.ui.xmlfragment(
								that.getView().getId(),
								"MDM_QIR.Fragments.SucessDialog",
								that
							);

							that.getView().addDependent(that.oSuccessdialog);
						}

						gbusyDialog.close();
						that.oSuccessdialog.open();

					} else if (oData.MsgType === "E") {

						gbusyDialog.close();

						ErrorHandler.showCustomSnackbar(
							oData.Message,
							"Error",
							that
						);

					}

					// sap.ui.core.UIComponent.getRouterFor(that).navTo("UWL");
				},
				error: function(oError) {
					gbusyDialog.close();
					ErrorHandler.showCustomSnackbar(i18n.getText("Submit_failed"), "Error", that);
					sap.ui.core.UIComponent.getRouterFor(that).navTo("UWL");
				}
			});
		},
		fn_ValidationMessagePress: function(oEvent) {
			var oItem = oEvent.getParameter("listItem");
			var oCtx = oItem.getBindingContext("ValidationMsgModel");
			console.log("pressed error", oItem);
			if (!oCtx) {
				return;
			}

			var oMsg = oCtx.getObject();
			this._applyFieldError(oMsg, false);
		},
		_applyFieldError: function(oMsg, vInitial) {
			console.log("Message ", oMsg);
			var sFieldId = oMsg.FieldId;
			var sMessage = oMsg.Message || "Invalid entry";
			var oControl = null;

			if (oMsg.MsgType === 'S') {
				return;
			}
			if (oMsg.FieldId === "ID_QIR_ICV1_NOINSP" && oMsg.MsgType === 'W') {
				this.byId("ID_QIR_ICV2_NOINSPABN").setSelected(false);
				ErrorHandler.showCustomSnackbar(i18n.getText("field_no_insp_uncheck_error"), "Warning", this);
				return;
			}
			if (!vInitial) {

				this._clearAllFieldErrors();

			}
			if (sFieldId) {
				oControl = this.byId(sFieldId);
				if (!oControl) {
					oControl = sap.ui.getCore().byId(this.createId(sFieldId));
				}
			}

			if (!oControl && oMsg.RowNo !== undefined && oMsg.RowNo !== "") {
				oControl = this._findTableControl(sFieldId, oMsg.RowNo);
			}

			if (!oControl && oMsg.FieldName) {
				oControl = this._findControlByFieldName(oMsg.FieldName);
			}

			if (oControl && oControl.setValueState) {
				oControl.setValueState(sap.ui.core.ValueState.Error);
				oControl.setValueStateText(sMessage);

				setTimeout(function() {
					oControl.focus();
				}, 200);
			}

			if (this._oValidationDialog) {
				this._oValidationDialog.close();
			}
		},

		handleMessagePopoverPress: function(oEvent) {
			this.fn_validateAndSubmit(oEvent, true);
			var that = this;

			if (!this._oPopover) {
				this._oPopover = new sap.m.Popover({
					contentWidth: "400px",
					contentHeight: "350px",
					placement: sap.m.PlacementType.Top,
					title: "Messages",
					content: new sap.m.List({
						items: {
							path: "JM_MsgModel>/messages",
							template: new sap.m.CustomListItem({
								content: new sap.m.Toolbar({
									height: "2.5rem",
									active: true,
									press: this.onMessageItemPress.bind(this),
									content: [
										new sap.m.Image({
											width: "1rem",
											height: "1rem",
											src: that.getView().getModel("JM_ImageModel").getProperty("/path") + "mark.svg"
										}),
										new sap.m.Label({
											text: "{JM_MsgModel>title}"
										}).addStyleClass("cl_errorPopUpTxt"),
										new sap.m.ToolbarSpacer(),
										new sap.m.Image({
											width: "1rem",
											height: "1rem",
											src: {
												path: "JM_MsgModel>type",
												formatter: function(sType) {
													var sBasePath = this.getView()
														.getModel("JM_ImageModel")
														.getProperty("/path");
													switch (sType) {
														case "Error":
															return sBasePath + "ArrowUpRight.svg";
														case "Warning":
															return sBasePath + "warning.svg";
														case "Success":
															return sBasePath + "success.svg";
														default:
															return sBasePath + "info.svg";
													}
												}.bind(this)
											}
										})
									]
								}).addStyleClass("cl_errorToolBar")
							})
						}
					})
				}).addStyleClass("cl_errorPopover");

				this.getView().addDependent(this._oPopover);
			}
			this._oPopover.openBy(oEvent.getSource());
		},

		onMessageItemPress: function(oEvent) {
			var oContext = oEvent.getSource().getBindingContext("JM_MsgModel");
			if (!oContext) {
				return;
			}
			var that = this;
			var oData = oContext.getObject();
			console.log("org msg model data", oData)
			if (oData.fieldId === "ID_QIR_ICV1_QSSYSDAT1" && oData.title === i18n.getText("fill_before_datefield")) {
				var oControlId = that.byId("ID_QIR_ICV1_QSSYSFAM");
				oControlId.setValueState("Error");
				oControlId.setValueStateText(i18n.getText("fill_this_before_date"));
			}
			if (oData.fieldId === "ID_QIR_ICV1_NOINSP" && oData.title === i18n.getText("set_one_indicator_error")) {
				var oControlId = that.byId("ID_QIR_ICV2_NOINSPABN");
				oControlId.setValueState("Error");
				oControlId.setValueStateText(i18n.getText("set_one_indicator_error"));
			}
			// this.fnExpancdErrorPanel(oData.fieldId);
			setTimeout(function() {
				if (oData.fieldId) {
					var oControl = that.byId(oData.fieldId);
					if (oControl) {
						oControl.focus();
						oControl.setValueState("Error");
						oControl.setValueStateText(oData.title);
						that._oPopover.close();
					}
				}
			}, 300);
		},

		messageButtonVisible: function(aMessages) {
			if (!aMessages || !aMessages.length) {
				return false;
			}

			for (var i = 0; i < aMessages.length; i++) {
				if (aMessages[i].type === "Error") {
					return true;
				}
			}
			return false;
		},

		messageButtonText: function(aMessages) {
			if (!aMessages) {
				return "";
			}
			return "Error (" + aMessages.length + ")";
		},
		_findControlByFieldName: function(sFieldName) {
			var oFieldModel = this.getView().getModel("JM_FieldModel");
			var aMeta = oFieldModel.getProperty("/data") || [];
			var oMatch = null;
			var oControl = null;
			var that = this;

			aMeta.some(function(oField) {
				if (oField.Fnm === sFieldName) {
					oMatch = oField;
					return true;
				}
				return false;
			});

			if (oMatch && oMatch.FnmId) {
				oControl = that.byId(oMatch.FnmId);
				if (!oControl) {
					oControl = sap.ui.getCore().byId(that.createId(oMatch.FnmId));
				}
			}

			return oControl;
		},
		_clearAllFieldErrors: function() {
			var oFieldModel = this.getView().getModel("JM_FieldModel");
			var aMeta = oFieldModel.getProperty("/data") || [];
			var that = this;

			aMeta.forEach(function(oField) {
				var oControl = null;

				if (oField.FnmId) {
					oControl = that.byId(oField.FnmId) || sap.ui.getCore().byId(that.createId(oField.FnmId));
				}

				if (oControl && oControl.setValueState) {
					oControl.setValueState(sap.ui.core.ValueState.None);
				}
				if (oControl && oControl.setValueStateText) {
					oControl.setValueStateText("");
				}
			});
		},

		fn_getFieldValues: function(aFieldValues, aKeyValues, aRules) {
			var that = this;
			var oFieldModel = this.getView().getModel("JM_FieldModel");
			var aMeta = oFieldModel ? oFieldModel.getProperty("/fieldvalues") || [] : [];

			if ((!aFieldValues || !Array.isArray(aFieldValues)) && !aRules) {
				return;
			}
			if ((!aKeyValues || !Array.isArray(aKeyValues)) && !aRules) {
				return;
			}
			if (aKeyValues) {
				this.getView().byId("SID_QIR_MATNR").setValue(aKeyValues[0].Matnr);
				this.getView().byId("SID_QIR_MATNRDES").setValue(aKeyValues[0].Matnrdes);
				this.getView().byId("SID_QIR_LIFNR").setValue(aKeyValues[0].Vendor);
				this.getView().byId("SID_QIR_LIFNRDES").setValue(aKeyValues[0].Vendordes);
				this.getView().byId("SID_QIR_WERKS").setValue(aKeyValues[0].Werks);
				this.getView().byId("SID_QIR_WERKSDES").setValue(aKeyValues[0].Werksdes);
			}

			// this.getView().byId("SID_QIR_MATNR").setValue(aKeyValues[0].Matnr);

			if (aFieldValues) {
				aFieldValues.forEach(function(oItem) {
					var sFnm = oItem.Fnm || "";
					var sValue = (oItem.FnValue || "").toString().trim();

					if (!sFnm) {
						return;
					}

					var oMeta = null;

					aMeta.some(function(oField) {
						if (oField.Fnm === sFnm) {
							oMeta = oField;
							return true;
						}
						return false;
					});

					if (!oMeta) {
						return;
					}

					// skip table UI for now
					if (oMeta.TableUi === "X") {
						return;
					}

					// skip label/header for now
					if (oMeta.TypFld === "L" || oMeta.TypFld === "H") {
						return;
					}

					var sFieldId = oMeta.FnmId || "";

					if (!sFieldId) {
						return;
					}

					var oControl = that.byId(sFieldId);
					var oControlDes = that.byId(sFieldId + "DES");

					if (!oControl) {
						oControl = sap.ui.getCore().byId(that.createId(sFieldId));
					}

					if (!oControl) {
						return;
					}

					if (oControl.isA("sap.m.Input")) {

						var sValue = (oItem.FnValue || "").toString().trim();

						if (oMeta.FieldFormat === "QUAN") {
							if (sValue === "0") {

							}
							// convert to float and format
							var fVal = parseFloat(sValue);

							if (!isNaN(fVal)) {
								oControl.setValue(fVal.toFixed(oItem.FieldDec)); // adjust decimals
								if (oItem.RuleText && oControlDes) {
									oControlDes.setValue(oItem.RuleText);
								}
							} else {
								oControl.setValue("");
							}

						} else {
							oControl.setValue(sValue);
							if (oItem.RuleText && oControlDes) {

								oControlDes.setValue(oItem.RuleText);
							}
						}
					} else if (oControl.isA("sap.m.DatePicker")) {

						if (sValue && sValue.length === 8 && sValue !== "00000000") {

							var oDate = new Date(
								sValue.slice(0, 4),
								sValue.slice(4, 6) - 1,
								sValue.slice(6, 8)
							);

							oControl.setDateValue(oDate);

						} else {
							oControl.setValue("");
						}
					} else if (oControl.isA("sap.m.ComboBox")) {
						oControl.setSelectedKey(sValue);
						oControl.setValue(sValue);
					} else if (oControl.isA("sap.m.CheckBox")) {
						oControl.setSelected(
							sValue === "X" ||
							sValue === "x" ||
							sValue === true ||
							sValue === "true" ||
							sValue === "1"
						);
					}
				});

			}
			if (aRules) {
				aRules.forEach(function(oItem) {

					var oControl = that.byId(oItem.FnmId);

					if (oControl && oControl.getValue() === "") {
						oControl.setValue(oItem.Value);
						var oLabel = that.byId(oItem.FnmId + "L");
						if (oLabel) {
							oLabel.setText(oItem.FmmDes);
						}

						var oDesc = that.byId(oItem.FnmId + "DES");
						if (oDesc) {
							oDesc.setValue(oItem.RuleText);
						}
					}

				});
			}
			// oFieldModel.clear(true);
		},
		// fnFileSelected: function(oEvent) {
		// 	var that = this;
		// 	var vFileUploader = this.byId("hiddenUploader");
		// 	var vFile = oEvent.getParameter("files")[0];
		// 	if (vFile) {
		// 		if (vFile.size > 2 * 1024 * 1024) {
		// 			ErrorHandler.showCustomSnackbar(i18n.getText("file_size_error"), "Information", this);
		// 			vFileUploader.setValue("");
		// 			return;
		// 		}
		// 		var reader = new FileReader();
		// 		reader.onload = function(item) {
		// 			var sBase64 = item.target.result.split(",")[1];
		// 			var vTableModel = that.getView().getModel("JM_DocTypeModel");
		// 			var vRows = vTableModel.getProperty("/List");
		// 			var vDuplicate = vRows.some(function(row) {
		// 				return row.Xstring === sBase64;
		// 			});
		// 			if (vFileUploader) {
		// 				vFileUploader.setValue("");
		// 			}
		// 			if (vDuplicate) {
		// 				ErrorHandler.showCustomSnackbar(i18n.getText("file_already_uploadederror"), "Error", that);
		// 				return;
		// 			}
		// 			var oModel = that.getView().getModel("JM_UploadedFile");
		// 			oModel.setProperty("/uploadedFileName", vFile.name);
		// 			oModel.setProperty("/uploadedFileContent", sBase64);
		// 			oModel.setProperty("/uploadedMimeType", vFile.type);
		// 			oModel.setProperty("/uploadedFileSize", vFile.size);
		// 		};
		// 		reader.readAsDataURL(vFile);
		// 	}
		// },
		fnGetId: function(id) {
			return this.getView().byId(id);
		},
		// fnAttachPress: function() {
		// 	var vUploadModel = this.getView().getModel("JM_UploadedFile");
		// 	var vDocTableModel = this.getView().getModel("JM_DocTypeModel");
		// 	var vRows = vDocTableModel.getProperty("/List");
		// 	var vFileName = vUploadModel.getProperty("/uploadedFileName");
		// 	var vBase64 = vUploadModel.getProperty("/uploadedFileContent");
		// 	var vMimeType = vUploadModel.getProperty("/uploadedMimeType");
		// 	var vNewFileSize = vUploadModel.getProperty("/uploadedFileSize") || 0;
		// 	var vTagNameInput = this.getView().byId("id_tagInput").getValue().trim();
		// 	// var vDocTypeKey = this.getView().byId("id_varients").getSelectedKey() ;
		// 	var vDocTypeKey = "Default";
		// 	var vUser = this.getView().getModel("JM_UserModel").getProperty("/Uname");
		// 	if (!vFileName || !vBase64) {
		// 		ErrorHandler.showCustomSnackbar("Please Select a file", "Information", this);
		// 		return;
		// 	}
		// 	var bFileExists = vRows.some(function(row) {
		// 		return row.TagName === vFileName || row.Xstring === vBase64;
		// 	});
		// 	if (bFileExists) {
		// 		ErrorHandler.showCustomSnackbar(i18n.getText("file_already_uploadederror"), "Information", this);
		// 		return;
		// 	}
		// 	var iTotalSize = vNewFileSize; // start with new file
		// 	vRows.forEach(function(row) {
		// 		if (row.Size) {
		// 			iTotalSize += row.Size;
		// 		}
		// 	});
		// 	if (iTotalSize > 10 * 1024 * 1024) {
		// 		ErrorHandler.showCustomSnackbar(i18n.getText("total_sizeof_fileerror"), "Information", this);
		// 		return;
		// 	}
		// 	var fileSizeBytes = vNewFileSize;
		// 	// Convert to readable size string
		// 	var fileSizeDisplay = "";
		// 	if (fileSizeBytes < 1024) {
		// 		fileSizeDisplay = fileSizeBytes + " Bytes";
		// 	} else if (fileSizeBytes < 1024 * 1024) {
		// 		fileSizeDisplay = (fileSizeBytes / 1024).toFixed(2) + " KB";
		// 	} else {
		// 		fileSizeDisplay = (fileSizeBytes / (1024 * 1024)).toFixed(2) + " MB";
		// 	}
		// 	var vParts = vFileName.split(".");
		// 	var vExtension = vParts.length > 1 ? vParts.pop() : "";
		// 	var vNameWithoutExt = vParts.join(".");
		// 	if (vDocTypeKey)
		// 		vNameWithoutExt = vDocTypeKey + "_" + vNameWithoutExt;
		// 	var vTagNameFinal = vTagNameInput || vNameWithoutExt || "untitled";
		// 	var vFinalFilename = vTagNameFinal + (vExtension ? "." + vExtension : "");
		// 	var vTagExists = vRows.some(function(row) {
		// 		return row.TagName === vFinalFilename;
		// 	});
		// 	if (vTagExists) {
		// 		ErrorHandler.showCustomSnackbar("The tag name '" + vTagNameFinal + "' is already used.", "Warning", this);
		// 		return;
		// 	}
		// 	var vDocTypeFinal = vDocTypeKey || "Default";
		// 	vRows.push({
		// 		AttachmentNo: vRows.length + 1,
		// 		TagName: vFinalFilename,
		// 		DocType: vDocTypeFinal,
		// 		MimeType: vMimeType,
		// 		Xstring: vBase64,
		// 		Size: fileSizeDisplay,
		// 		CreatedOn: new Date(),
		// 		CreatedBy: vUser
		// 	});
		// 	vDocTableModel.setProperty("/List", vRows);
		// 	// this.fnUpdateStateMassDownload();
		// 	// Clear
		// 	vUploadModel.setProperty("/uploadedFileName", "");
		// 	vUploadModel.setProperty("/uploadedFileContent", "");
		// 	vUploadModel.setProperty("/uploadedMimeType", "");
		// 	vUploadModel.setProperty("/uploadedFileSize", 0);
		// 	this.getView().byId("id_tagInput").setValue("");
		// 	this.byId("fileUploader").clear();
		// 	// this.getView().byId("id_varients").setSelectedKey("");
		// },
		// fn_AttachFile: function() {

		// 	var oView = this.getView();

		// 	var sDocType = oView.byId("id_doccombo").getSelectedKey();
		// 	var sTagName = oView.byId("id_tagInput").getValue() || "";
		// 	var oFile = this._selectedFile;

		// 	if (!sDocType) {
		// 		ErrorHandler.showCustomSnackbar(i18n.getText("doc_type_choose"), "Error");
		// 		sDocType = "Default";
		// 	}

		// 	if (!oFile) {
		// 		ErrorHandler.showCustomSnackbar(i18n.getText("choose_file"), "Error");
		// 		return;
		// 	}

		// 	if (!sTagName) {
		// 		ErrorHandler.showCustomSnackbar(i18n.getText("enter_tag_name"), "Error");
		// 		return;
		// 	}
		// 	var oModel = oView.getModel("JM_Model");
		// 	var aData = oModel.getProperty("/data") || [];

		// 	var oEntry = {
		// 		Count: aData.length + 1,
		// 		Tagname: sTagName,
		// 		Doctype: sDocType,
		// 		Filesize: (oFile.size / 1024).toFixed(2) + " KB",
		// 		FileName: oFile.name,
		// 		FileObject: oFile
		// 	};

		// 	var sOriginalName = oFile.name;

		// 	var iDotIndex = sOriginalName.lastIndexOf(".");
		// 	var sName = iDotIndex !== -1 ? sOriginalName.substring(0, iDotIndex) : sOriginalName;
		// 	var sExt = iDotIndex !== -1 ? sOriginalName.substring(iDotIndex) : "";

		// 	var sNewName = sOriginalName;
		// 	var iCounter = 1;

		// 	while (aData.some(function(item) {
		// 			return item.FileName === sNewName;
		// 		})) {
		// 		sNewName = sName + "(" + iCounter + ")" + sExt;
		// 		iCounter++;
		// 	}
		// 	aData.push(oEntry);
		// 	oModel.setProperty("/data", aData);

		// 	oView.byId("id_doccombo").setSelectedKey("");
		// 	oView.byId("fileUploader").clear();
		// 	oView.byId("tagInput").setValue("");

		// 	this._selectedFile = null;

		// 	sap.m.MessageToast.show("File attached successfully");
		// },
		fn_DeleteFileRow: function(oEvent) {

			var oButton = oEvent.getSource();

			// get row context
			var oContext = oButton.getBindingContext("JM_DocTypeModel");

			if (!oContext) {
				return;
			}

			var sPath = oContext.getPath(); // e.g. /data/2
			var iIndex = parseInt(sPath.split("/").pop(), 10);

			var oModel = this.getView().getModel("JM_DocTypeModel");
			var aData = oModel.getProperty("/List");
			var oRow = aData[iIndex];
			console.log("attchemnt during deletion", oRow);
			if ((oRow.CreatedBy !== this.userName) || oRow.CreatedBy === undefined) {
				ErrorHandler.showCustomSnackbar(i18n.getText("dont_allow_delete"), "Error", this);

				return;
			}

			// remove selected row
			aData.splice(iIndex, 1);

			// reassign count
			aData.forEach(function(oItem, index) {
				oItem.Count = index + 1;
			});

			// update model
			oModel.setProperty("/List", aData);
			ErrorHandler.showCustomSnackbar(i18n.getText("row_deleted_successfully"), "Success", this);
		},

		/************************************************************************************************************************
		Sendback Functionlity Start
		************************************************************************************************************************/
		fnSendback: function() {
			var that = this;
			var vComments = this.getView().byId("id_textarea");
			if (vComments.getValue() === "") {
				ErrorHandler.showCustomSnackbar(i18n.getText("No_Comment_err"), "Error", this);
				vComments.focus();
				return;
			}
			var olevelDetailsSet = this.getOwnerComponent().getModel("JM_Config");
			gbusyDialog.open();
			olevelDetailsSet.read("/Level_DetailsSet", {
				filters: [
					new sap.ui.model.Filter("Transid", sap.ui.model.FilterOperator.EQ, that.vTransid)
				],
				success: function(oData, response) {
					// 1. Build unique Level list
					var aLevels = [];
					var oLevelMap = {};
					var oMinApproverMap = {};
					for (var i = 0; i < oData.results.length; i++) {
						var sLvl = oData.results[i].Lvl;
						var sMinApprover = oData.results[i].MinApprover;
						if (!oLevelMap[sLvl]) {
							oLevelMap[sLvl] = true;
							aLevels.push({
								Level: sLvl
							});
							oMinApproverMap[sLvl] = sMinApprover;
						}
					}

					// 2. Set Level Model
					// var oLevelModel = new sap.ui.model.json.JSONModel({
					// 	LevelData: aLevels
					// });
					// that.getView().setModel(oLevelModel, "JM_LevelModel");
					var oLevelModel = that.getView().getModel("JM_LevelModel");

					if (!oLevelModel) {
						oLevelModel = new sap.ui.model.json.JSONModel();
						that.getView().setModel(oLevelModel, "JM_LevelModel");
					}

					// Preserve existing properties like /level
					oLevelModel.setProperty("/LevelData", aLevels);
					// 3. Set MinApprover Model
					var oMinApproverModel = new sap.ui.model.json.JSONModel({
						MinApproverMap: oMinApproverMap
					});
					that.getView().setModel(oMinApproverModel, "JM_MinApproverModel");

					// 3. Set Agent Model (empty first)
					var oAgentModel = new sap.ui.model.json.JSONModel({
						Agents: [] // empty initially
					});
					that.getView().setModel(oAgentModel, "JM_AgentModel");

					// keep full data in view for filtering
					that._allAgentData = oData.results;

					that.fnOpenSendBackDialog();

					var oLevelTable = sap.ui.getCore().byId("idLevelTable"); // adjust ID if needed
					if (oLevelTable && aLevels.length > 0) {
						for (var j = 0; j < aLevels.length; j++) {
							if (aLevels[j].Level === "L0") {
								oLevelTable.setSelectedIndex(j);
								that._currentLevel = "L0";
								that._currentLevelIndex = j;
								that.fnloadAgentsForLevel("L0"); // load agents for L0
								break;
							}
						}
					}
					gbusyDialog.close();
				},
				error: function(oResponse) {
					gbusyDialog.close();
					var sMessage = ErrorHandler.parseODataError(oResponse);
					ErrorHandler.showCustomSnackbar(sMessage, "Error", that);
				}
			});
			// }
		},

		fnOpenSendBackDialog: function() {
			// Open dialog
			if (!this.sendBackDialog) {
				this.sendBackDialog = sap.ui.xmlfragment("MDM_QIR.Fragments.SendBack", this);
				this.getView().addDependent(this.sendBackDialog);
			}
			this.sendBackDialog.open();
		},

		onLevelSelect: function(oEvent) {
			var oTable = oEvent.getSource();
			var iIndex = oTable.getSelectedIndex();
			var oAgentModel = this.getView().getModel("JM_AgentModel");
			var that = this;

			if (iIndex === -1) {
				oAgentModel.setProperty("/Agents", []);
				this._currentLevelIndex = -1;
				this._currentLevel = null;
				return;
			}

			var oContext = oTable.getContextByIndex(iIndex);
			var sSelectedLevel = oContext.getObject().Level;

			var aAgents = oAgentModel.getData().Agents;
			var editedFlag = false;
			for (var i = 0; i < aAgents.length; i++) {
				if (aAgents[i].checkboxstate === false) {
					editedFlag = true;
					break;
				}
			}

			// if (editedFlag && this._currentLevel !== null && this._currentLevel !== sSelectedLevel) {
			// 	this._pendingLevel = sSelectedLevel;
			// 	this._pendingLevelIndex = iIndex;
			// 	oTable.setSelectedIndex(this._currentLevelIndex);
			// 	var oPopupModel = new sap.ui.model.json.JSONModel({
			// 		title: "Confirmation",
			// 		text: "Do you want Change the level?",
			// 		negativeButton: "No",
			// 		negativeIcon: "sap-icon://decline",
			// 		positiveButton: "Yes",
			// 		positiveIcon: "sap-icon://accept",
			// 		Indicator: "SendBack"
			// 	});

			// 	// Set model with name
			// 	this.getView().setModel(oPopupModel, "JM_Popup");
			// 	if (!this.oDialog) {
			// 		this.oDialog = sap.ui.xmlfragment(this.getView().getId(),
			// 			"MDS_BOM.Fragment.ConfirmationExitPopup", // Fragment path
			// 			this
			// 		);
			// 		this.getView().addDependent(this.oDialog);
			// 	}

			// 	this.oDialog.open();

			// } else {
			// --- fetch MinApprover from model ---
			var oMinApproverModel = this.getView().getModel("JM_MinApproverModel");
			var sMinApprover = oMinApproverModel.getProperty("/MinApproverMap/" + sSelectedLevel);

			// --- set label text via model ---
			if (sSelectedLevel === "L0") {
				oMinApproverModel.setProperty("/LabelText", "");
			} else {
				if (sMinApprover) {
					oMinApproverModel.setProperty("/LabelText", "Minimum Number of Send Back: " + sMinApprover);
				} else {
					oMinApproverModel.setProperty("/LabelText", "");
				}
			}
			// normal load
			this.fnloadAgentsForLevel(sSelectedLevel);
			this._currentLevel = sSelectedLevel;
			this._currentLevelIndex = iIndex;
			// }
		},

		fnLevelChange: function() {
			var oAgentModel = this.getView().getModel("JM_AgentModel");
			var aAgents = oAgentModel.getData().Agents;

			for (var i = 0; i < aAgents.length; i++) {
				aAgents[i].checkboxstate = false;
			}
			oAgentModel.setProperty("/Agents", aAgents);

			// 2. load agents for the pending level
			if (this._pendingLevel) {
				this.fnloadAgentsForLevel(this._pendingLevel);

				// update the level table selection
				var oLevelTable = sap.ui.getCore().byId("idLevelTable");
				if (this._pendingLevelIndex !== undefined && this._pendingLevelIndex !== null) {
					oLevelTable.setSelectedIndex(this._pendingLevelIndex);
				}

				// update current level trackers
				this._currentLevel = this._pendingLevel;
				this._currentLevelIndex = this._pendingLevelIndex;

				// clear pending variables
				this._pendingLevel = null;
				this._pendingLevelIndex = null;

				if (this.oDialog) {
					this.oDialog.close();
					this.oDialog.destroy();
					this.oDialog = null;
				}
			}
		},

		fnloadAgentsForLevel: function(sLevel) {
			var aFilteredAgents = [];
			for (var i = 0; i < this._allAgentData.length; i++) {
				if (this._allAgentData[i].Lvl === sLevel) {
					aFilteredAgents.push({
						indicator: this.changeidicatortoImage(this._allAgentData[i].Submit),
						Agent: this._allAgentData[i].Agent,
						AgentName: this._allAgentData[i].Name,
						checkboxstate: true,
						checkboxEditable: true
					});
				}
			}
			this.getView().getModel("JM_AgentModel").setProperty("/Agents", aFilteredAgents);

			this._currentLevel = sLevel;
		},

		changeidicatortoImage: function(value) {
			if (value === "X") {
				return this.getView().getModel("JM_ImageModel").getProperty("/path") + "NodesGrn.svg";
			} else {
				return this.getView().getModel("JM_ImageModel").getProperty("/path") + "orangeIcon.svg";
			}

		},

		fnsendBackSelect: function() {
			gbusyDialog.open();
			var oLevelModel = this.getView().getModel("JM_LevelModel");
			var oAgentModel = this.getView().getModel("JM_AgentModel");

			// 1. Get currently selected level
			var aLevels = oLevelModel.getProperty("/LevelData");
			var sCurrentLevel = null;
			for (var i = 0; i < aLevels.length; i++) {
				if (i === this._currentLevelIndex) {
					sCurrentLevel = aLevels[i].Level;
					break;
				}
			}

			if (!sCurrentLevel) {
				ErrorHandler.showCustomSnackbar(i18n.getText("PleaseSelectLevel"), "Warning", this);
				gbusyDialog.close();
				return;
			}

			var aAllAgents = oAgentModel.getProperty("/Agents");
			var aSelectedAgents = [];
			for (var j = 0; j < aAllAgents.length; j++) {
				if (aAllAgents[j].checkboxstate === true) {
					aSelectedAgents.push({
						Agents: aAllAgents[j].Agent
					});
				}
			}

			if (aSelectedAgents.length === 0) {
				ErrorHandler.showCustomSnackbar(i18n.getText("PleaseSelectAgent"), "Warning", this);
				gbusyDialog.close();
				return;
			}
			var that = this;

			var vPayload = {
				"Appid": this.vAppId,
				// "MsgType": "S",
				"Ind": "S",
				"Transid": this.vTransid,
				"WiId": this.vWorkItemid,
				"Lvl": sCurrentLevel,
				"NavAgent": aSelectedAgents
			};

			vPayload.NavComment = [];
			var vCommentsValue = this.getView().byId("id_textarea").getValue();

			vPayload.NavComment.push({
				"Comments": vCommentsValue
			});
			console.log("payload", vPayload);
			var vSendBackModel = this.getOwnerComponent().getModel();

			// Appid: sAppId,
			// Transid: sTransId,
			// WiId: sWiId,
			// Wfparm1: sWfparm1,
			// Wfparm2: sWfparm2,
			// Wfparm3: sWfparm3,
			// Wfparm4: sWfparm4,
			// Matnr: sMatnr,
			// Werks: sWerks,
			// Revlv: sRevlv,
			// Leiferant: sVendor,
			// MsgType: "",
			// Message: "",
			// Ind: "",
			// NavFieldItems: aNavData

			if (this.vAppId === "QIRC" || this.vAppId === "QIRX") {
				vSendBackModel.create("/FieldHeaderSet", vPayload, {
					success: function(oData) {

						if (oData.MsgType === "E") {
							ErrorHandler.showCustomSnackbar(oData.Message, "Error", that);
							gbusyDialog.close();
						} else {
							// ErrorHandler.showCustomSnackbar(oData.Message, "Success", that);
							that.fnSendBackClose();
							var oPopupModel = new sap.ui.model.json.JSONModel({
								title: "Confirmation",
								text: oData.Message,
								positiveButton: "OK",
								positiveIcon: that.getView().getModel("JM_ImageModel").getProperty("/path") + "Continue.svg",
								Indicator: "UWL"
							});

							that.getView().setModel(oPopupModel, "JM_Popup");
							if (!that.oSuccessdialog) {
								that.oSuccessdialog = sap.ui.xmlfragment(
									that.getView().getId(),
									"MDM_QIR.Fragments.SucessDialog",
									that
								);
								that.getView().addDependent(that.oSuccessdialog);
							}

							that.oSuccessdialog.open();
							setTimeout(function() {
								gbusyDialog.close();
								// that.fnClearAllFields();
								// sap.ui.core.UIComponent.getRouterFor(that).navTo("UWL");
							}, 1000);
						}
					},
					error: function(oResponse) {
						gbusyDialog.close();
						var vMessage = ErrorHandler.parseODataError(oResponse.Message);
						ErrorHandler.showCustomSnackbar(vMessage, "Error", that);
					}
				});
			}
			// else if (this.vAppId === "CC") {
			// 	vSendBackModel.create("/SetConfigFieldCustSet", vPayload, {
			// 		success: function(oData) {
			// 			if (oData.MsgType === "E") {
			// 				ErrorHandler.showCustomSnackbar(oData.Message, "Error", that);
			// 				gbusyDialog.close();
			// 			} else {
			// 				ErrorHandler.showCustomSnackbar(oData.Message, "Success", that);
			// 				that.fnSendBackClose();
			// 				setTimeout(function() {
			// 					gbusyDialog.close();
			// 					that.fnClearAllFields();
			// 					sap.ui.core.UIComponent.getRouterFor(that).navTo("UWL");
			// 				}, 1000);
			// 			}
			// 		},
			// 		error: function(oResponse) {
			// 			gbusyDialog.close();
			// 			var vMessage = ErrorHandler.parseODataError(oResponse.Message);
			// 			ErrorHandler.showCustomSnackbar(vMessage, "Error", that);
			// 		}
			// 	});
			// }
		},

		fnSendBackClose: function(oEvent) {
			if (this.sendBackDialog) {
				this.sendBackDialog.close();
				this.sendBackDialog.destroy();
				this.sendBackDialog = null;
			}
			// Clear Level and Agent models
			var oLevelModel = this.getView().getModel("JM_LevelModel");
			var oAgentModel = this.getView().getModel("JM_AgentModel");

			if (oLevelModel) {
				oLevelModel.setProperty("/LevelData", []);
			}
			if (oAgentModel) {
				oAgentModel.setProperty("/Agents", []);
			}
		},
		/************************************************************************************************************
		 Reject Functionlity 
		************************************************************************************************************/
		fnReject: function() {
			var vComments = this.getView().byId("id_textarea");
			var vCommentValue = vComments.getValue().trim();
			if (vCommentValue === "") {
				ErrorHandler.showCustomSnackbar("Please enter comments", "Information", this);
				vComments.focus();
				return;
			} else {
				var that = this;
				this._openConfirmDialog(
					"Confirmation",
					"Are you sure you want to reject this requested transaction ID?",
					function(bConfirmed) {
						if (bConfirmed) {
							that.fnRejectSubmit();
						}
					}
				);
				// var vConfirmModel = new sap.ui.model.json.JSONModel({
				// 	headerText: this.i18n.getText("confirm_title"),
				// 	confirmationText: "Do you want to Reject this transaction ID?",
				// 	positiveText: this.i18n.getText("yes"),
				// 	negativeText: this.i18n.getText("no"),
				// 	positiveIcon: this.getView().getModel("JM_ImageModel").getProperty("/path") + "Apply.svg",
				// 	negativeIcon: this.getView().getModel("JM_ImageModel").getProperty("/path") + "Cancel.svg",
				// 	action: "Reject"
				// });
				// this.getView().setModel(vConfirmModel, "JM_Confirm");
				// if (!this.confirmfrag) {
				// 	this.confirmfrag = sap.ui.xmlfragment("MDM_QIR.Fragments.Confirmation", this);
				// 	this.getView().addDependent(this.confirmfrag);

				// }
				// this.confirmfrag.open();
			}
		},
		fnRejectSubmit: function() {
			var that = this;
			var vPayload = {
				"Appid": this.vAppId,
				"Ind": "E",
				"Transid": this.vTransid,
				"WiId": this.vWorkItemid
			};
			vPayload.NavComment = [];
			var vCommentsValue = this.getView().byId("id_textarea").getValue();

			vPayload.NavComment.push({
				"Comments": vCommentsValue
			});

			var vModel = this.getOwnerComponent().getModel();

			if (this.vAppId === "QIRC" || this.vAppId === "QIRX") {
				gbusyDialog.open();
				vModel.create("/FieldHeaderSet", vPayload, {
					success: function(oData) {
						gbusyDialog.close();
						if (oData.MsgType === "E") {
							ErrorHandler.showCustomSnackbar(oData.Message, "Error", that);
						} else {
							// ErrorHandler.showCustomSnackbar(oData.Message, "Success", that);
							var oPopupModel = new sap.ui.model.json.JSONModel({
								title: "Confirmation",
								text: oData.Message,
								positiveButton: "OK",
								positiveIcon: that.getView().getModel("JM_ImageModel").getProperty("/path") + "Continue.svg",
								Indicator: "UWL"
							});

							that.getView().setModel(oPopupModel, "JM_Popup");
							if (!that.oSuccessdialog) {
								that.oSuccessdialog = sap.ui.xmlfragment(
									that.getView().getId(),
									"MDM_QIR.Fragments.SucessDialog",
									that
								);
								that.getView().addDependent(that.oSuccessdialog);
							}

							that.oSuccessdialog.open();
							setTimeout(function() {
								gbusyDialog.close();
								that.fnClearAllFields();
								sap.ui.core.UIComponent.getRouterFor(that).navTo("UWL");
							}, 1000);
							// sap.ui.core.UIComponent.getRouterFor(that).navTo("UWL");
						}
					},
					error: function(oResponse) {
						gbusyDialog.close();
						var vMessage = ErrorHandler.parseODataError(oResponse.Message);
						ErrorHandler.showCustomSnackbar(vMessage, "Error", that);
					}
				});
			}
			// else if (this.vAppId === "CC") {
			// 	gbusyDialog.open();
			// 	vModel.create("/SetConfigFieldCustSet", vPayload, {
			// 		success: function(oData) {
			// 			gbusyDialog.close();
			// 			if (oData.MsgType === "E") {
			// 				ErrorHandler.showCustomSnackbar(oData.Message, "Error", that);

			// 			} else {
			// 				ErrorHandler.showCustomSnackbar(oData.Message, "Success", that);
			// 				sap.ui.core.UIComponent.getRouterFor(that).navTo("UWL");

			// 			}
			// 		},
			// 		error: function(oResponse) {
			// 			gbusyDialog.close();
			// 			var vMessage = ErrorHandler.parseODataError(oResponse.Message);
			// 			ErrorHandler.showCustomSnackbar(vMessage, "Error", that);
			// 		}
			// 	});
			// }

		},
		fnCreateCommentUI: function(oCommentData) {

			var oContainer = this.byId("id_comments");

			var oDot = new sap.m.VBox({
				width: "5px",
				items: [
					new sap.m.Image({
						src: this.getView().getModel("JM_ImageModel").getProperty("/path") + "CommentDot.svg",
						width: "10px",
						height: "10px"
					}).addStyleClass("cl_dot")
				]
			});

			var oHeader = new sap.m.HBox({
				alignItems: "Center",
				width: "100%",
				justifyContent: "SpaceBetween",
				items: [

					new sap.m.HBox({
						alignItems: "Center",
						items: [
							new sap.m.Image({
								src: this.getView().getModel("JM_ImageModel").getProperty("/path") + "profile.png",
								width: "20px",
								height: "20px"
							}).addStyleClass("cl_avatarImg"),

							new sap.m.Text({
								text: oCommentData.User
							}).addStyleClass("cl_user sapUiTinyMarginBegin")
						]
					}),

					new sap.m.Text({
						text: oCommentData.Action || "Added a Comment"
					}).addStyleClass("cl_commentInfo"),

					new sap.m.HBox({
						alignItems: "Center",
						items: [
							new sap.m.Image({
								src: this.getView().getModel("JM_ImageModel").getProperty("/path") + "Dot.svg",
								width: "8px",
								height: "8px"
							}).addStyleClass("sapUiTinyMarginEnd"),

							new sap.m.Text({
								text: oCommentData.DateTime
							}).addStyleClass("cl_time")
						]
					})
				]
			});

			var oText = new sap.m.Text({
				text: oCommentData.Text,
				wrapping: true
			});

			var oMessage = new sap.m.VBox({
				items: [oText]
			}).addStyleClass("cl_message");

			var oMessageBox = new sap.m.VBox({
				width: "30%",
				items: [oHeader, oMessage]
			}).addStyleClass("sapUiSmallMarginBegin");

			var oRow = new sap.m.HBox({
				alignItems: "Start",
				width: "100%",
				items: [oDot, oMessageBox]
			}).addStyleClass("sapUiSmallMarginBottom sapUiTinyMarginTop");

			oContainer.addItem(oRow);
		},
		fnDownloadSingleFile: function(oEvent) {
			var vContext = oEvent.getSource().getBindingContext("JM_DocTypeModel");
			var vFile = vContext.getObject(); // contains Xstring and TagName

			if (!vFile || !vFile.Xstring || !vFile.TagName) {
				ErrorHandler.showCustomSnackbar("File data is missing.", "Error", this);
				return;
			}

			try {
				var byteCharacters = atob(vFile.Xstring);
				var byteNumbers = new Array(byteCharacters.length);
				for (var i = 0; i < byteCharacters.length; i++) {
					byteNumbers[i] = byteCharacters.charCodeAt(i);
				}
				var byteArray = new Uint8Array(byteNumbers);
				var blob = new Blob([byteArray]);

				// Create temporary <a> element to trigger download
				var vLink = document.createElement("a");
				vLink.href = URL.createObjectURL(blob);
				vLink.download = vFile.TagName;
				document.body.appendChild(vLink);
				vLink.click();

				// Cleanup
				setTimeout(function() {
					URL.revokeObjectURL(vLink.href);
					document.body.removeChild(vLink);
				}, 100);
			} catch (e) {
				sap.m.MessageBox.error("Failed to download file.");
			}
		},
		fn_SetAttachmentData: function(oData) {

			var aData = [];

			if (oData && oData.results) {
				aData = oData.results;
			} else if (Array.isArray(oData)) {
				aData = oData;
			}

			var aFormatted = aData.map(function(item, index) {
				return {
					AttachmentNo: item.SerialNo || (index + 1),
					TagName: item.FileName || "",
					MimeType: item.MimeType || "",
					DocType: item.DocType || "Default",
					Size: item.FileSize || "",
					ObjectId: item.ObjectId,
					Xstring: item.Xstring,
					CreatedBy: item.CreatedBy
				};
			});

			var oModel = new sap.ui.model.json.JSONModel();
			oModel.setData({
				List: aFormatted
			});

			this.getView().setModel(oModel, "JM_DocTypeModel");
		},
		fnRefresh: function() {

			if (this.oSuccessdialog) {
				this.oSuccessdialog.close();
			}
			var vViewStateModel = this.getOwnerComponent().getModel("JM_ViewStateModel");
			if (vViewStateModel) {
				var vFromUWL = vViewStateModel.getProperty("/fromUWL");
				var vFromDashboard = vViewStateModel.getProperty("/fromDashboard");

			}
			this.fn_clearFieldData();
			gbusyDialog.open();
			setTimeout(function() {
				// this.fnClearAllFields();
				if (vFromUWL) {
					sap.ui.core.UIComponent.getRouterFor(this).navTo("UWL");
					gbusyDialog.close();
				} else if (vFromDashboard) {
					sap.ui.core.UIComponent.getRouterFor(this).navTo("Dashboard");
					gbusyDialog.close();
				} else {
					sap.ui.core.UIComponent.getRouterFor(this).navTo("Search");
					gbusyDialog.close();
				}
			}.bind(this), 2000);

		},
		fnMassDownload: function() {
			var vTableModel = this.getView().getModel("JM_DocTypeModel");
			var vFiles = vTableModel.getProperty("/List");

			if (vFiles.length === 0) {
				ErrorHandler.showCustomSnackbar("No files to Download", "Error", this);
				return;
			}

			var vButton = this.fnGetId("id_massDownloadButton");
			if (vButton) {
				vButton.setEnabled(false);
			}

			// var vZip = new JSZip();
			var JSZip = this.getOwnerComponent().JSZip;
			var vZip = new JSZip();

			vFiles.forEach(function(file) {
				if (file.Xstring && file.TagName) {
					var byteCharacters = atob(file.Xstring);
					var byteNumbers = new Array(byteCharacters.length);
					for (var i = 0; i < byteCharacters.length; i++) {
						byteNumbers[i] = byteCharacters.charCodeAt(i);
					}
					var byteArray = new Uint8Array(byteNumbers);

					vZip.file(file.TagName, byteArray);
				}
			});

			// Create the ZIP file
			vZip.generateAsync({
				type: "blob"
			}).then(function(content) {
				var zipName = "Attachments.zip";

				var vLink = document.createElement("a");
				vLink.style.display = "none";
				vLink.href = URL.createObjectURL(content);
				vLink.download = zipName;

				document.body.appendChild(vLink);
				vLink.click();

				// Clean up
				setTimeout(function() {
					URL.revokeObjectURL(vLink);
					document.body.removeChild(vLink);

					if (vButton) {
						vButton.setEnabled(true); // Re-enable after download
					}
				}, 100);
			}).catch(function(err) {
				// console.error("ZIP creation failed: ", err);
				sap.m.MessageBox.error("Failed to generate ZIP file.");
				if (vButton) {
					vButton.setEnabled(true);
				}
			});
		},
		fn_clearFieldData: function() {

			var fromModel = this.getOwnerComponent().getModel("JM_ViewStateModel");
			if (fromModel) {
				var fromKey = fromModel.getProperty("/fromKeyData");
			} else {
				this.getOwnerComponent().getRouter().navTo("Search");
				return;
			}
			if (fromKey) {
				this.getOwnerComponent().getModel("JM_ContextModel").setData(null);
			}

			var oView = this.getView();
			var oContainer = this.getView().byId("container");

			if (oContainer) {
				oContainer.destroyItems();

				oContainer.findAggregatedObjects(true, function(oControl) {

					if (oControl.setValue) {
						oControl.setValue("");
					}

					if (oControl.setSelected) {
						oControl.setSelected(false);
					}

				});
			}

			var oAttachModel = oView.getModel("JM_DocTypeModel");
			if (oAttachModel) {
				oAttachModel.setData(null);
			}

			// this.byId("fileUploader").clear();

			var fieldModel = oView.getModel("JM_FieldModel");
			if (fieldModel) {
				fieldModel.setData(null);
			}

			this.byId("id_textarea").setValue("");
			this.byId("id_comments").destroyItems();
		},
		fn_livelengthset: function(oController, Fid, Fval) {

			var oFields = this.getView().getModel("JM_FieldModel").getProperty("/data");
			var oControl = this.byId(Fid);
			var field = null;

			for (var i = 0; i < oFields.length; i++) {
				if (oFields[i].FnmId === Fid) {
					field = oFields[i];
					break;
				}
			}
			if (!field) return;

			var iFieldLength = parseInt(field.FieldLength.trim(), 10);
			var iDecimal = parseInt(field.FieldDec || "0", 10);

			if (!Fval) return;

			var iAllowedPos = iFieldLength - iDecimal;

			var dotIndex = Fval.indexOf(".");

			if (iDecimal > 0) {

				if (dotIndex !== -1 && dotIndex < iAllowedPos) {
					oControl.setValueState(sap.ui.core.ValueState.Error);
					oControl.setValueStateText("Decimal point (.) is not allowed here. Enter it only after " + iAllowedPos + " digits.");
					ErrorHandler.showCustomSnackbar(
						"Decimal point (.) is not allowed here. Enter it only after " + iAllowedPos + " digits.",
						"Error",
						this
					);

					Fval = Fval.replace(".", "");
				}

				if (Fval.length > iAllowedPos && dotIndex === -1) {
					oControl.setValueState(sap.ui.core.ValueState.Error);
					oControl.setValueStateText("Decimal point (.) is required after " + iAllowedPos + " digits.");
					ErrorHandler.showCustomSnackbar(
						"Decimal point (.) is required after " + iAllowedPos + " digits.",
						"Error",
						this
					);

					Fval = Fval.substring(0, iAllowedPos);
				}

				if ((Fval.match(/\./g) || []).length > 1) {
					Fval = Fval.replace(/\.(?=.*\.)/g, "");
				}

				if (dotIndex !== -1) {
					var parts = Fval.split(".");
					if (parts[1].length > iDecimal) {
						parts[1] = parts[1].substring(0, iDecimal);
						Fval = parts[0] + "." + parts[1];
					}
				}

			} else {
				if (Fval.includes(".")) {
					oControl.setValueState(sap.ui.core.ValueState.Error);
					oControl.setValueStateText("Decimal not allowed for this field.");
					ErrorHandler.showCustomSnackbar(
						"Decimal not allowed for this field.",
						"Error",
						this
					);
					Fval = Fval.replace(/\./g, "");
				}
			}

			var iMaxLength = iFieldLength;

			// ✔ Add +1 ONLY if decimal exists
			if (iDecimal > 0) {
				iMaxLength = iFieldLength + 1; // for dot
			}

			if (Fval.length > iMaxLength) {
				Fval = Fval.substring(0, iMaxLength);
			}

			oController.byId(Fid).setValue(Fval);
		},
		fnChangelog: function() {
			if (!this.Changelog) {
				this.Changelog = sap.ui.xmlfragment(this.getView().getId(),
					"MDM_QIR.Fragments.QIRChangeLog", // Fragment name
					this // Pass controller instance
				);
				this.getView().addDependent(this.Changelog);
			}

			this.Changelog.open();
		},
		fnCloseChanLogDialog: function() {
			if (this.Changelog) {
				this.Changelog.close();
				this.Changelog.destroy();
				this.Changelog = null;
			}
		},
		// fnFieldChange: function(oEvent) {

		// 	var oSource = oEvent.getSource();
		// 	var sNewValue = (oSource.getValue() || "").trim();
		// 	var sFieldId = oSource.getId().split("--").pop();

		// 	var oFieldModel = this.getView().getModel("JM_FieldModel");
		// 	var aFieldValues = oFieldModel.getProperty("/fieldvalues") || [];
		// 	console.log(oFieldModel);

		// 	// Find matching field using ID or custom data
		// 	var oMatchedField = aFieldValues.find(function(item) {
		// 		return item.FnmId === sFieldId; // adjust key logic if needed
		// 	});

		// 	if (!oMatchedField) {
		// 		return;
		// 	}

		// 	var sOldValue = (oMatchedField.FnValue || "").trim();

		// 	if ((sOldValue || "") === (sNewValue || "")) {
		// 		this.fn_removeFromChangeLog(sFieldId);
		// 		return;
		// 	}

		// 	var oChangeLogModel = this.getView().getModel("JM_ChangeLog");
		// 	var aChangeLog = oChangeLogModel.getProperty("/") || [];

		// 	// Check if already exists
		// 	var iIndex = aChangeLog.findIndex(function(item) {
		// 		return item.FieldId === sFieldId;
		// 	});

		// 	var oChangeEntry = {
		// 		FieldId: sFieldId,
		// 		View: oMatchedField.Vwnm,
		// 		FieldName: oMatchedField.FmmDes, // optional
		// 		OldValue: sOldValue,
		// 		NewValue: sNewValue,
		// 		ChangedBy: this.userName
		// 	};

		// 	if (iIndex > -1) {

		// 		// keep original old value
		// 		aChangeLog[iIndex].NewValue = sNewValue;
		// 		aChangeLog[iIndex].ChangedBy = this.userName;

		// 	} else {

		// 		aChangeLog.push({
		// 			FieldId: sFieldId,
		// 			View: oMatchedField.Vwnm,
		// 			FieldName: oMatchedField.FmmDes,
		// 			OldValue: sOldValue,
		// 			NewValue: sNewValue,
		// 			ChangedBy: this.userName
		// 		});
		// 	}

		// 	oChangeLogModel.setProperty("/", aChangeLog);
		// },
		fnFieldChange: function(oEvent) {
			var oSource = oEvent.getSource();
			var sNewValue;

			if (oSource.isA("sap.m.CheckBox")) {
				sNewValue = oSource.getSelected() ? "X" : "";
			} else {
				sNewValue = (oSource.getValue() || "").trim();
			}

			var sFieldId = oSource.getId().split("--").pop();

			var oFieldModel = this.getView().getModel("JM_FieldModel");
			var aFieldValues = oFieldModel.getProperty("/fieldvalues") || [];

			var oMatchedField = aFieldValues.find(function(item) {
				return item.FnmId === sFieldId;
			});
			var that = this;

			if (!oMatchedField) return;

			var oChangeLogModel = this.getView().getModel("JM_ChangeLog");
			var aChangeLog = oChangeLogModel.getProperty("/") || [];

			var iIndex = aChangeLog.findIndex(function(item) {
				return item.FieldId === sFieldId;
			});

			if (iIndex > -1) {
				// Entry already exists — preserve the original OldValue, only update NewValue
				var sOriginalOldValue = aChangeLog[iIndex].OldValue;

				if ((sOriginalOldValue || "") === (sNewValue || "")) {
					// User typed back the original value → remove from change log
					this.fn_removeFromChangeLog(sFieldId);
					return;
				}

				aChangeLog[iIndex].NewValue = sNewValue;
				aChangeLog[iIndex].ChangedBy = that.userName;

			} else {
				// First time this field is changed — capture OldValue from model
				var sOldValue = (oMatchedField.FnValue || "").trim();

				if ((sOldValue || "") === (sNewValue || "")) {
					// No real change
					return;
				}

				aChangeLog.push({
					FieldId: sFieldId,
					View: oMatchedField.Vwnm,
					FieldName: oMatchedField.FmmDes,
					OldValue: sOldValue,
					NewValue: sNewValue,
					ChangedBy: that.userName
				});
			}

			oChangeLogModel.setProperty("/", aChangeLog);
		},
		fn_removeFromChangeLog: function(sFieldId) {

			var oChangeLogModel = this.getView().getModel("JM_ChangeLog");
			var aChangeLog = oChangeLogModel.getProperty("/") || [];

			var aFiltered = aChangeLog.filter(function(item) {
				return item.FieldId !== sFieldId;
			});

			oChangeLogModel.setProperty("/", aFiltered);
		},
		fn_getLogValues: function(NavLogValues) {

			var oChangeLogModel = this.getView().getModel("JM_ChangeLog");

			if (!oChangeLogModel) {
				oChangeLogModel = new sap.ui.model.json.JSONModel();
				this.getView().setModel(oChangeLogModel, "JM_ChangeLog");
			}

			var oFieldModel = this.getView().getModel("JM_FieldModel");

			var aFieldData = [];

			if (oFieldModel) {
				aFieldData = oFieldModel.getProperty("/data") || [];
			}

			var aFinalData = [];

			if (NavLogValues.results && NavLogValues.results.length > 0) {

				for (var i = 0; i < NavLogValues.results.length; i++) {

					var oItem = NavLogValues.results[i];

					var sFieldName = "";

					for (var j = 0; j < aFieldData.length; j++) {

						if (aFieldData[j].FnmId === oItem.FieldId) {
							sFieldName = aFieldData[j].FmmDes;
							break;
						}
					}

					aFinalData.push({
						ItemNo: oItem.ItemNo,
						View: oItem.View || oItem.Viewnm,
						FieldId: oItem.FieldId,
						FieldName: sFieldName,
						OldValue: oItem.OldValue,
						NewValue: oItem.NewValue,
						ChangedBy: oItem.ChangedBy,
						ChangedOn: oItem.ChangedOn
					});
				}
			}
			console.log("final data changelog", aFinalData);

			oChangeLogModel.setProperty("/", aFinalData);
		},
		/*************************** Attachment Upload functionality (Start)***********************/
		fnUploadButtonpress: function() {
			var vFileUploader = this.byId("hiddenUploader");
			if (vFileUploader) {
				var vDomRef = vFileUploader.getFocusDomRef();
				if (vDomRef) {
					vDomRef.click();
				}
			}
		},
		fnFileSelected: function(oEvent) {
			var that = this;
			var vFileUploader = this.byId("hiddenUploader");
			var vFile = oEvent.getParameter("files")[0];
			if (vFile) {
				if (vFile.size > 2 * 1024 * 1024) {
					ErrorHandler.showCustomSnackbar("Each file must be less that 2 MB", "Information", this);
					vFileUploader.setValue("");
					return;
				}
				var reader = new FileReader();
				reader.onload = function(item) {
					var sBase64 = item.target.result.split(",")[1];
					var vTableModel = that.getView().getModel("JM_DocTypeModel");
					var vRows = vTableModel.getProperty("/List");
					var vDuplicate = vRows.some(function(row) {
						return row.Xstring === sBase64;
					});
					if (vFileUploader) {
						vFileUploader.setValue("");
					}
					if (vDuplicate) {
						ErrorHandler.showCustomSnackbar("This file has already been uploaded", "Error", that);
						return;
					}
					var oModel = that.getView().getModel("JM_UploadedFile");
					oModel.setProperty("/uploadedFileName", vFile.name);
					oModel.setProperty("/uploadedFileContent", sBase64);
					oModel.setProperty("/uploadedMimeType", vFile.type);
					oModel.setProperty("/uploadedFileSize", vFile.size);
				};
				reader.readAsDataURL(vFile);
			}
		},

		fnAttachPress: function() {
			var vUploadModel = this.getView().getModel("JM_UploadedFile");
			var vDocTableModel = this.getView().getModel("JM_DocTypeModel");
			var vRows = vDocTableModel.getProperty("/List");
			var vFileName = vUploadModel.getProperty("/uploadedFileName");
			var vBase64 = vUploadModel.getProperty("/uploadedFileContent");
			var vMimeType = vUploadModel.getProperty("/uploadedMimeType");
			var vNewFileSize = vUploadModel.getProperty("/uploadedFileSize") || 0;
			var vTagNameInput = this.fnGetId("id_tagInput").getValue().trim();
			var vDocTypeKey = this.fnGetId("id_doccombo").getSelectedKey();
			var vUser = this.userName;
			if (!vFileName || !vBase64) {
				ErrorHandler.showCustomSnackbar("Please Select a file", "Information", this);
				return;
			}
			var bFileExists = vRows.some(function(row) {
				return row.TagName === vFileName || row.Xstring === vBase64;
			});
			if (bFileExists) {
				ErrorHandler.showCustomSnackbar("This file has already been uploaded", "Information", this);
				return;
			}
			var iTotalSize = vNewFileSize; // start with new file
			vRows.forEach(function(row) {
				if (row.Size) {
					iTotalSize += row.Size;
				}
			});
			if (iTotalSize > 10 * 1024 * 1024) {
				ErrorHandler.showCustomSnackbar("Total size of all files must be less than 10 MB.", "Information", this);
				return;
			}
			var fileSizeBytes = vNewFileSize;
			// Convert to readable size string
			var fileSizeDisplay = "";
			if (fileSizeBytes < 1024) {
				fileSizeDisplay = fileSizeBytes + " Bytes";
			} else if (fileSizeBytes < 1024 * 1024) {
				fileSizeDisplay = (fileSizeBytes / 1024).toFixed(2) + " KB";
			} else {
				fileSizeDisplay = (fileSizeBytes / (1024 * 1024)).toFixed(2) + " MB";
			}
			var vParts = vFileName.split(".");
			var vExtension = vParts.length > 1 ? vParts.pop() : "";
			var vNameWithoutExt = vParts.join(".");
			if (vDocTypeKey)
				vNameWithoutExt = vDocTypeKey + "_" + vNameWithoutExt;
			var vTagNameFinal = vTagNameInput || vNameWithoutExt || "untitled";
			var vFinalFilename = vTagNameFinal + (vExtension ? "." + vExtension : "");
			var vTagExists = vRows.some(function(row) {
				return row.TagName === vFinalFilename;
			});
			if (vTagExists) {
				ErrorHandler.showCustomSnackbar("The tag name '" + vTagNameFinal + "' is already used.", "Warning", this);
				return;
			}
			var vDocTypeFinal = vDocTypeKey || "Default";
			vRows.push({
				AttachmentNo: vRows.length + 1,
				TagName: vFinalFilename,
				DocType: vDocTypeFinal,
				MimeType: vMimeType,
				Xstring: vBase64,
				Size: fileSizeDisplay,
				CreatedOn: new Date(),
				CreatedBy: vUser
			});
			vDocTableModel.setProperty("/List", vRows);
			// this.fnUpdateStateMassDownload();
			// Clear
			vUploadModel.setProperty("/uploadedFileName", "");
			vUploadModel.setProperty("/uploadedFileContent", "");
			vUploadModel.setProperty("/uploadedMimeType", "");
			vUploadModel.setProperty("/uploadedFileSize", 0);
			this.fnGetId("id_tagInput").setValue("");
			this.fnGetId("id_doccombo").setSelectedKey("");
		},
		fnSetDocument: function(oEvent) {

			var oSelectedItem = oEvent.getParameter("selectedItem");

			if (!oSelectedItem) {
				return;
			}

			var sDocType = oSelectedItem.getKey();

			this.byId("id_tagInput").setValue(sDocType);
		},
	});
});