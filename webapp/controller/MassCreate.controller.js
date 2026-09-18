sap.ui.define([
	"MDM_QIR/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"MDM_QIR/controller/ErrorHandler",
	"sap/ui/export/Spreadsheet",
	"MDM_QIR/Formatter/formatter"
], function(BaseController, JSONModel, ErrorHandler, Spreadsheet, formatter) {
	"use strict";
	var i18n;
	var gbusyDialog = new sap.m.BusyDialog();
	return BaseController.extend("MDM_QIR.controller.MassCreate", {
		formatter: formatter,
		onInit: function() {
			BaseController.prototype.onInit.apply(this, arguments);
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
					oJsonModel.refresh(true);
					// that.getOwnerComponent().setModel(oJsonModel, "JM_UserModel");

				},
				error: function(err) {
					ErrorHandler.showCustomSnackbar(i18n.getText("userName_fetch_err"), "Error", that);
					return;
				}
			});
			// Attach router
			var oRouter = this.getOwnerComponent().getRouter();
			oRouter.getRoute("MassCreate").attachPatternMatched(this.fn_RouteMatched, this);
		},
		fn_RouteMatched: function(oEvent) {

			this.fn_clearFieldData();

			// this._clearInitiatorData();

			var oView = this.getView();

			var sRoute = oEvent.getParameter("name");

			if (sRoute !== "MassCreate") {
				// this.fn_clearFields();
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

			var contextModel = this.getOwnerComponent().getModel("JM_ContextModel");
			var viewStateModel = this.getOwnerComponent().getModel("JM_ViewStateModel");

			if (!viewStateModel) {
				this.getOwnerComponent().getRouter().navTo("Search");
				return;
			}

			this.getView().setModel(
				new sap.ui.model.json.JSONModel({
					Rows: []
				}),
				"JM_TableModel"
			);

			this.getView().setModel(
				new sap.ui.model.json.JSONModel({
					Rows: []
				}),
				"JM_ItemModel"
			);

			var oMainModel = new sap.ui.model.json.JSONModel({
				uploadedTemplateFileName: "",
				TemplateFileName: ""
			});
			this.getView().setModel(oMainModel, "JM_TemplateModel");

			oView.setModel(new sap.ui.model.json.JSONModel({
				enable: false
			}), "JM_EnableTable");

			oView.setModel(new sap.ui.model.json.JSONModel({
				enable: true
			}), "JM_EnableModel");

			this.byId("FileUploaderId").setEnabled(true);

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
			// console.log("From_Model", fromModel);
			// console.log("Context Model", contextModel);
			// console.log("view_Model", viewStateModel);
			// console.log("Level_Model", levelModel);

			this._updateActiveTabByIndicator(levelModel.getProperty("/level"));
			// this.fn_getInputFields(levelModel.getProperty("/level"), this.vTransid, fromModel.getProperty("/fromUWL"), fromModel.getProperty(
			// 	"/fromKeydata"), fromModel.getProperty("/fromDashboard"));
			var oWerks = this.getView().byId("ID_QIR_WERKS");
			oWerks.setEditable(true);
			if (this.vTransid) {

				this.fnGetValuesByTransId(this.vTransid);
			}
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
			// setTimeout(function() {
			// 	gbusyDialog.open();
			// 	if (contextModel.getProperty("/Appid") === "QIRX") {
			// 		that.fnChangelog();
			// 		gbusyDialog.close();
			// 	}
			// 	gbusyDialog.close();
			// }, 500);
			gbusyDialog.close();
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
		fn_updateheading: function(vTransid, vAppid, vTypLvl) {
			var heading1;
			var heading2;
			var level;
			var process;
			if (vAppid === "QIRMC") {
				process = "Mass Creation";
			} else if (vAppid === "QIRMX") {
				process = "Mass Change";
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
				if (level !== "" && level !== undefined && this.SendBack !== 'X') {
					heading2 = process + " : " + level + " - " + vTransid;
				} else if ((level !== "" && level !== undefined) || this.SendBack === 'X') {
					heading2 = process + " : " + vTransid;
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
		fn_clearFields: function() {
			this.byId("ID_QIR_WERKS").setValue("");
			this.byId("ID_QIR_WERKSDES").setValue("");
		},
		fn_NavBack: function() {
			var that = this;
			this._openConfirmDialog(
				"Confirmation",
				"Are you sure want to exit ?",
				function() {

					that.fn_clearFields();
					that.getOwnerComponent().getRouter().navTo("Search");

				}
			);

		},
		_buildDynamicTable: function(aFields) {
			var oImageModel = new sap.ui.model.json.JSONModel({ // This Model for template download
				Template: aFields
			});
			console.log("table template fields ", aFields);
			this.getView().setModel(oImageModel, "JM_Template");
			var oFieldModel = this.getView().getModel("JM_FieldModel");
			oFieldModel.setProperty("/data", aFields);
			var oTable = this.byId("idDynamicTable");

			oTable.destroyColumns();

			// Fixed Columns
			if (aFields.length > 3) {
				oTable.destroyColumns();
				this._addFixedColumns(oTable);
			}
			aFields.forEach(function(oField) {
				console.log(
					oField.Fnm,
					oField.TableUi
				);
			});
			var that = this;
			// Dynamic Columns
			aFields.forEach(function(oField) {

				if (
					oField.TableUi === "X" ||
					oField.Fnm === "LIEFERANT" ||
					oField.Fnm === "MATNR" ||
					oField.Fnm === "WERK"
				) {
					return;
				}

				// var sLabel =
				// 	oField.Rqr === "X" ? oField.FmmDes + " *" : oField.FmmDes;

				var oTemplate;
				var isHaveValueHelp =
					(oField.SearchHelp || "").trim() === "P" || (oField.SearchHelp || "").trim() === "F";
				if (oField.TypFld === "C") {

					oTemplate = new sap.m.CheckBox({
						selected: {
							path: "JM_TableModel>" + oField.Fnm,
							formatter: function(v) {
								return v === "X" || v === true;
							}
						},
						select: function(oEvent) {
							var bSelected = oEvent.getParameter("selected");
							var oContext = oEvent.getSource().getBindingContext("JM_TableModel");

							oContext.getModel().setProperty(
								oContext.getPath() + "/" + oField.Fnm,
								bSelected ? "X" : ""
							);
						}
					}).addStyleClass("cl_checkbox sapUiSizeCompact");

				} else if (oField.FieldFormat === "DATS") {

					oTemplate = new sap.m.DatePicker({
						value: "{JM_TableModel>" + oField.Fnm + "}",
						valueFormat: "yyyyMMdd",
						displayFormat: "dd-MM-yyyy",
						width: "100%",
						change: function(oEvent) {
							that.fnLiveErrorChange(oEvent);
						},
						editable: oField.Dsply !== "X"
					}).addStyleClass("cl_tabinput cl_input cl_inputrev sapUiSizeCompact");

				} else {

					// oTemplate = new sap.m.Input({
					// 	value: "{JM_TableModel>" + oField.Fnm + "}",
					// 	showValueHelp: isHaveValueHelp,
					// 	editable: oField.Dsply !== "X",
					// 	valueHelpRequest: function(oEvent) {
					// 		that.fn_openF4(oEvent);
					// 	}
					// }).addStyleClass("cl_tabinput cl_input cl_inputrev sapUiSizeCompact");
					oTemplate = new sap.m.Input({
						value: "{JM_TableModel>" + oField.Fnm + "}",
						showValueHelp: isHaveValueHelp,
						editable: oField.Dsply !== "X",
						valueHelpRequest: function(oEvent) {
							that.fn_openTableF4(oEvent);
						},
						liveChange: function(oEvent) {
							that.fnLiveErrorChange(oEvent);
						},
					}).addStyleClass("cl_tabinput cl_input cl_inputrev sapUiSizeCompact");

					oTemplate.data("FieldId", oField.FnmId);
					oTemplate.data("FieldName", oField.Fnm);
					oTemplate.data("SearchHelp", oField.SearchHelp);
				}

				// Width calculation
				var iLength = parseInt(oField.FieldLength || "10", 10);

				var sWidth;

				if (oField.FieldFormat === "DATS") {
					sWidth = "140px";
				} else {
					sWidth = Math.max(iLength * 12, 150) + "px";
					var vWidth = Math.max(iLength * 12, 150);
					if (vWidth > 150) {
						sWidth = "150px";
					}
				}

				var oColumn = new sap.ui.table.Column({
					width: sWidth,
					label: new sap.m.Label({
						text: oField.FmmDes,
						required: oField.Rqr === "X",
						wrapping: true
					}),
					template: oTemplate
				});

				oColumn.data("FieldName", oField.Fnm);
				oColumn.data("FieldId", oField.FnmId);

				oTable.addColumn(oColumn);

			});
		},
		_addFixedColumns: function(oTable) {
			var levelModel = this.getView().getModel("JM_LevelModel");
			var vLevel = "I";
			var vSendback = "";
			if (levelModel) {
				vLevel = this.getView().getModel("JM_LevelModel").getProperty("/level");
				vSendback = this.getView().getModel("JM_LevelModel").getProperty("/sendback");
			}
			// Item No
			oTable.addColumn(
				new sap.ui.table.Column({
					label: new sap.m.Label({
						text: "Item No"
					}),
					template: new sap.m.Link({
						text: "{JM_TableModel>ItemNo}",
						press: this.onItemNoPress.bind(this)
					}),
					width: "100px"
				})
			);

			// Material
			var oMatCol = new sap.ui.table.Column({
				label: new sap.m.Label({
					text: "Material Number",
					required: true
				}),
				template: new sap.m.Input({
					id: "SID_QIR_MATNR",
					value: "{JM_TableModel>MATNR}",
					showValueHelp: true,
					editable: vLevel === "I" && vSendback !== "X",
					valueHelpRequest: this.fn_openF4.bind(this)
				}).addStyleClass("cl_tabinput cl_input cl_inputrev sapUiSizeCompact")
			});

			oMatCol.data("FieldName", "MATNR");
			oMatCol.data("FieldId", "SID_QIR_MATNR");
			oTable.addColumn(oMatCol);

			// Plant
			var oWerksCol = new sap.ui.table.Column({
				label: new sap.m.Label({
					text: "Plant",
					required: true
				}),
				template: new sap.m.Input({
					id: "SID_QIR_WERKS",
					value: this.getView().byId("ID_QIR_WERKS").getValue(),
					editable: false,
					showValueHelp: true,
					valueHelpRequest: this.fn_openF4.bind(this)
				}).addStyleClass("cl_tabinput cl_input cl_inputrev sapUiSizeCompact")
			});

			oWerksCol.data("FieldName", "WERK");
			oWerksCol.data("FieldId", "SID_QIR_WERKS");
			oTable.addColumn(oWerksCol);
			// Vendor
			var oLifnrCol = new sap.ui.table.Column({
				label: new sap.m.Label({
					text: "Vendor",
					required: true
				}),
				template: new sap.m.Input({
					id: "SID_QIR_LIFNR",
					editable: vLevel === "I" && vSendback !== "X",
					value: "{JM_TableModel>LIEFERANT}",
					showValueHelp: true,
					valueHelpRequest: this.fn_openF4.bind(this)
				}).addStyleClass("cl_tabinput cl_input cl_inputrev sapUiSizeCompact")
			});

			oLifnrCol.data("FieldName", "LIEFERANT");
			oLifnrCol.data("FieldId", "SID_QIR_LIEFERANT");
			oTable.addColumn(oLifnrCol);

			oTable.setFixedColumnCount(4);
		},
		fnAddStatusColumn: function() {

			var oTable = this.byId("idDynamicTable");

			var bExists = oTable.getColumns().some(function(oColumn) {
				return oColumn.data("StatusColumn") === true;
			});

			if (bExists) {
				return;
			}

			var oStatusColumn = new sap.ui.table.Column({
				label: new sap.m.Label({
					text: "Status"
				}),
				template: new sap.m.ObjectStatus({
					text: "{JM_TableModel>Status}",
					state: {
						path: "JM_TableModel>Status",
						formatter: function(sStatus) {

							if (sStatus === "Error") {
								return sap.ui.core.ValueState.Error;
							}

							if (sStatus === "Created") {
								return sap.ui.core.ValueState.Success;
							}

							return sap.ui.core.ValueState.None;
						}
					}
				}),
				width: "120px"
			});

			oStatusColumn.data("StatusColumn", true);

			oTable.insertColumn(oStatusColumn, 1); // after Item No
		},
		fnAddRow: function() {

			var oModel = this.getView().getModel("JM_TableModel");
			console.log("Table Model", oModel);
			var aRows = oModel.getProperty("/Rows") || [];

			var aFields = this.getView()
				.getModel("JM_FieldModel")
				.getProperty("/data") || [];
			this._aFieldMetadata = aFields;

			var aRequiredFields = aFields
				.filter(function(oField) {
					return oField.Rqr === "X" && oField.TableUi !== 'X';
				})
				.map(function(oField) {
					return oField.Fnm;
				});

			var bHasEmptyRow = aRows.some(function(oRow) {

				return aRequiredFields.some(function(sField) {
					return !oRow[sField];
				});

			});

			if (bHasEmptyRow) {
				ErrorHandler.showCustomSnackbar(
					"Please fill the empty row first",
					"Error",
					this
				);
				return;
			}

			// aRows.push({
			// 	ItemNo: String(aRows.length + 1),
			// 	ItemDetails: []
			// });
			aRows.push({
				ItemNo: String(aRows.length + 1).padStart(10, "0"),
				WERK: this.getView().byId("ID_QIR_WERKS").getValue(),
				ItemDetails: [],
				Attachments: []
			});

			oModel.refresh(true);
		},
		fnDeleteRow: function() {

			var oTable = this.byId("idDynamicTable");
			var iSelectedIndex = oTable.getSelectedIndex();

			if (iSelectedIndex === -1) {

				ErrorHandler.showCustomSnackbar(
					"Please select a row to delete",
					"Error",
					this
				);
				return;
			}

			var oModel = this.getView().getModel("JM_TableModel");
			var aRows = oModel.getProperty("/Rows") || [];

			aRows.splice(iSelectedIndex, 1);

			// Renumber ItemNo
			aRows.forEach(function(oRow, iIndex) {
				oRow.ItemNo = String(iIndex + 1).padStart(10, "0");
			});

			oModel.setProperty("/Rows", aRows);
			oTable.clearSelection();

		},
		// onItemNoPress: function(oEvent) {

		// 	var oRow = oEvent.getSource()
		// 		.getBindingContext("JM_TableModel")
		// 		.getObject();

		// 	this._oSelectedHeaderRow = oRow;

		// 	this._openItemDialog(oRow);

		// },
		onItemNoPress: function(oEvent) {

			var oContext = oEvent.getSource().getBindingContext("JM_TableModel");
			var oRow = oContext.getObject();

			this._oSelectedHeaderRow = oRow;
			this._sCurrentPath = oContext.getPath(); // "/0" "/1" "/2"
			console.log(oContext.getPath());
			this._iCurrentRowIndex = Number(
				this._sCurrentPath.substring(
					this._sCurrentPath.lastIndexOf("/") + 1
				)
			);

			var oTable = sap.ui.getCore().byId(
				this.getView().createId("idDynamicTable")
			);

			var aSelectedIndices = oTable.getSelectedIndices();

			if (aSelectedIndices.length > 1) {
				sap.m.MessageBox.error("Please select only one row.");
				return;
			}

			if (!this.getView().getModel("DialogModel")) {

				this.getView().setModel(
					new sap.ui.model.json.JSONModel({
						SelectedItemNo: ""
					}),
					"DialogModel"
				);
			}

			this.getView().getModel("DialogModel").setProperty(
				"/SelectedItemNo",
				oRow.ItemNo
			);

			var oDocModel = this.getView().getModel("JM_DocTypeModel");
			// var oListAtt = oDocModel.getProperty("/List");
			// if (!oListAtt) {
			oDocModel.setProperty(
				"/List",
				oRow.Attachments || []
			);
			// }

			this._openItemDialog(oRow);
		},

		_openItemDialog: function(oRow) {

			if (!oRow) {
				sap.m.MessageToast.show("No row data found");
				return;
			}

			if (!this._TableItem) {

				this._TableItem = sap.ui.xmlfragment(
					this.getView().getId(),
					"MDM_QIR.Fragments.TableItem",
					this
				);

				this.getView().addDependent(this._TableItem);
			}

			var oItemModel = this.getView().getModel("JM_ItemModel");

			if (!oItemModel) {

				oItemModel = new sap.ui.model.json.JSONModel({
					Rows: []
				});

				this.getView().setModel(
					oItemModel,
					"JM_ItemModel"
				);
			}

			// QIR does not have ItemDetails
			oItemModel.setProperty("/Rows", []);

			this._buildItemTable();

			this._TableItem.open();
		},
		fnClose: function() {

			this._TableItem.close();
			this._TableItem.destroy();
			this._TableItem = null;
		},
		_buildItemTable: function() {

			var oTable = sap.ui.getCore().byId(
				this.getView().createId("idItemTable")
			);

			if (!oTable) {
				return;
			}

			oTable.destroyColumns();

			var aFields =
				this.getView()
				.getModel("JM_FieldModel")
				.getProperty("/data") || [];
			console.log("all Item Fields", aFields);
			var that = this;
			aFields.forEach(function(oField) {

				// Only Item fields
				if (
					oField.TableUi !== "X" ||
					oField.TypFld !== "L"
				) {
					return;
				}
				var isHaveValueHelp =
					(oField.SearchHelp || "").trim() === "P";
				var oTemplate;
				console.log("isValueHelp", isHaveValueHelp);

				if (oField.FieldFormat === "DATS") {

					oTemplate = new sap.m.DatePicker({
						value: "{JM_ItemModel>" + oField.Fnm + "}"
					}).addStyleClass("cl_tabinput cl_input cl_inputrev sapUiSizeCompact");

				} else {

					oTemplate = new sap.m.Input({
						value: "{JM_ItemModel>" + oField.Fnm + "}",
						showValueHelp: isHaveValueHelp,
						valueHelpRequest: function(oEvent) {
							that.fn_openF4(oEvent);
						}
					}).addStyleClass("cl_tabinput cl_input cl_inputrev sapUiSizeCompact");

				}

				oTable.addColumn(
					new sap.ui.table.Column({

						width: Math.max(
							oField.FmmDes.length * 10,
							150
						) + "px",

						label: new sap.m.Label({
							text: oField.FmmDes,
							required: oField.Rqr === "X",
							wrapping: true
						}),

						template: oTemplate

					})
				);

			});
			console.log("Metadata", this._aFieldMetadata);
		},
		fn_additemrow: function() {

			var oModel = this.getView().getModel("JM_ItemModel");

			var aRows = oModel.getProperty("/Rows") || [];

			var oNewRow = {};
			var aFields =
				this.getView()
				.getModel("JM_FieldModel")
				.getProperty("/data") || [];

			aFields.forEach(function(oField) {

				if (
					oField.TableUi === "X" &&
					oField.TypFld === "L"
				) {
					oNewRow[oField.Fnm] = "";
				}

			});

			aRows.push(oNewRow);

			oModel.refresh(true);

		},
		fnDownloadMassTemplate: function() {
			var oModel = this.getView().getModel("JM_Template");
			if (!oModel) {
				ErrorHandler.showCustomSnackbar("Data not found", "Error", this);
				return;
			}
			var aAllData = oModel.getProperty("/Template") || [];
			if (aAllData.length === 0) {
				ErrorHandler.showCustomSnackbar("No template fields available", "Error", this);
				return;
			}
			var aHeaderRow = [];
			var aFieldKeys = [];

			var aRequiredFields = [
				"MATNR",
				// "WERK",
				"LIEFERANT",
				"FREI_DAT",
				"NOINSP",
				"VORLABN",
				"CERTCONTROL",
				"NOINSPABN",
				"VARIABNAHM",
				"QSSYSFAM",
				"BEST_MG",
				"FREI_MNG"
			];

			aAllData.forEach(function(oRow) {

				if (
					oRow.FmmDes &&
					aRequiredFields.includes(oRow.Fnm)
				) {

					aHeaderRow.push(oRow.FmmDes);
					aFieldKeys.push(oRow.Fnm);
				}

			});

			// aAllData.forEach(function(oRow) {
			// 	//add by Kalai Arasu on 12.03.2026
			// 	// if ((oRow.FmmDes && !["WERKS", "POSNR", "BMEIN"].includes(oRow.Fnm) && oRow.Ronly !== 'X')) {
			// 	if (
			// 		oRow.FmmDes &&
			// 		!["WERKS", "POSNR", "BMEIN"].includes(oRow.Fnm) &&
			// 		(oRow.Ronly !== 'X' || oRow.Fnm === "MATNR")
			// 	) {
			// 		aHeaderRow.push(oRow.FmmDes);
			// 		aFieldKeys.push(oRow.Fnm);
			// 	}
			// 	// if (oRow.FmmDes && !["WERKS", "POSNR"].includes(oRow.Fnm)) {
			// 	// 	aHeaderRow.push(oRow.FmmDes);
			// 	// 	aFieldKeys.push(oRow.Fnm);
			// 	// }
			// });

			if (aHeaderRow.length === 0) {
				ErrorHandler.showCustomSnackbar("No template fields available", "Error", this);
				return;
			}
			//end by Kalai Arasu on 12.03.2026
			var aSheetData = [];
			aSheetData.push(aHeaderRow); // Header row
			aSheetData.push(new Array(aHeaderRow.length).fill("")); // Empty row for user input
			var worksheet = XLSX.utils.aoa_to_sheet(aSheetData);

			// Enable filter on header
			// worksheet["!autofilter"] = {
			// 	ref: XLSX.utils.encode_range({
			// 		s: {
			// 			r: 0,
			// 			c: 0
			// 		},
			// 		e: {
			// 			r: 0,
			// 			c: aHeaderRow.length - 1
			// 		}
			// 	})
			// };
			var workbook = XLSX.utils.book_new();
			XLSX.utils.book_append_sheet(workbook, worksheet, "Mass_Template");
			XLSX.writeFile(workbook, "Mass_BOM_Template.xlsx");
		},
		//add by kalai Arasu on 17.03.2026
		fnTemplateUpload: function() {
			var oInput = this.byId("id_fileNameInput");
			oInput.setValue("");
			var oFileUploader = this.byId("FileUploaderId");

			if (oFileUploader) {
				var oFileInput = oFileUploader.getDomRef("fu");
				if (oFileInput) {
					oFileInput.click();
				}
			}
		},

		fnTemplateFileSelect: function(oEvent) {
			var that = this;
			var oFileUploader = this.byId("FileUploaderId");
			var oFile = oEvent.getParameter("files")[0];
			if (oFile) {
				if (oFile.size > 2 * 1024 * 1024) {
					ErrorHandler.showCustomSnackbar(i18n.getText("DocSizeError"), "Information", this);
					// ErrorHandler.showCustomSnackbar("Documnet size must be less than 2 mb", "Information", this);
					oFileUploader.setValue(""); // Reset to allow re-selection
					return;
				}
				var reader = new FileReader();
				reader.onload = function(e) {
					var sBase64 = e.target.result.split(",")[1];
					var oModel = that.getView().getModel("JM_TemplateModel");
					oModel.setProperty("/TemplateFileName", oFile.name);
					oModel.setProperty("/uploadedFileContent", sBase64);
					oModel.setProperty("/uploadedMimeType", oFile.type);
					oModel.setProperty("/uploadedFileSize", oFile.size);
					that.getView().byId("id_fileNameInput").setValue(oFile.name);
				};
				reader.readAsDataURL(oFile);
			}
		},

		fnExcelUpload: function() {
			if (!this.getView().byId("ID_QIR_WERKS").getValue()) {
				ErrorHandler.showCustomSnackbar(i18n.getText("enterplantfirst"), "Error", this);
				return;
			}
			var that = this;
			var oFileUploader = this.byId("FileUploaderId");
			var oFile = oFileUploader.oFileUpload.files[0];

			if (!oFile) {
				ErrorHandler.showCustomSnackbar(i18n.getText("Filenotdefined"), "Error", this);
				return;
			}

			var reader = new FileReader();
			reader.onload = function(event) {
				var data = event.target.result;
				var workbook = XLSX.read(data, {
					type: "binary"
				});
				var sheetName = workbook.SheetNames[0];
				var sheet = workbook.Sheets[sheetName];

				var excelData = XLSX.utils.sheet_to_json(sheet);
				var model = that.getOwnerComponent().getModel("JM_ContextModel");
				//add by kalai Arasu on 13.03.2026
				that.getView().byId("id_Error_download_box").setVisible(false);
				that.getView().byId("messagePopoverBtn").setVisible(false);
				// that.getView().getModel("msgModel").setProperty("/messages", []);

				// Add by kalai Arasu on 25.03.2026
				var oErrorModel = that.getView().getModel("JM_ErrorModel");
				if (oErrorModel) {
					oErrorModel.setProperty("/errors", {});
				}
				//add by kalai Arasu on 27.03.2026
				// Row limit validation
				if (excelData && excelData.length > 250) {
					ErrorHandler.showCustomSnackbar(
						i18n.getText("250RowError"),
						"Error",
						that
					);

					// Clear file input properly
					oFileUploader.clear();
					that.getView().byId("id_fileNameInput").setValue("");
					var oBomModel = that.getView().getModel("JM_MassBOM");
					oBomModel.setProperty("/BOMRows", []);
					return;
				}
				// that.fnPrepareBOMFromExcel(excelData);
				that.fnCallBackend(excelData);
				// }
				oFileUploader.clear();
				that.getView().byId("id_fileNameInput").setValue("");

				// ErrorHandler.showCustomSnackbar("Excel Uploaded Successfully", "success", that);
			};

			reader.readAsBinaryString(oFile);
		},
		fnCallBackend: function(aExcelData) {
			var oPayload = this.fnPrepareQIRPayload(aExcelData);
			console.log('Final Payload while click upload', oPayload);
			var oModel = this.getOwnerComponent().getModel();
			var that = this;
			var enableModel = this.getView().getModel("JM_EnableModel");
			oModel.create("/KeyDataSet", oPayload, {
				success: function(oData) {
					console.log("oData Response while upload excel", oData);
					if (oData.NavErrors.results !== []) {
						that.fnSetErrorMessages(oData.NavErrors.results);
					}

					that.fnGetFieldValuesFromExcel(oData.NavGetInitVal.results);

					var oWerks = that.getView().byId("ID_QIR_WERKS");
					oWerks.setEditable(true);
					enableModel.setProperty("/enable", true);
					enableModel.refresh(true);
				},
				error: function(error) {
					ErrorHandler.showCustomSnackbar("Excel Uploaded Have Error", "Error", that);
					console.log("oData Response error while upload excel", error);
				}
			});
		},
		fnGetValuesByTransId: function(Tid) {
			var oPayload = {
				AppId: "QIRMC",
				Ind: "R",
				TransId: Tid,
				NavGetInitVal: [],
				NavGetInit: [],
				NavErrors: [],
				NavKeyValues: [],
				NavAttachmentRead: [],
				NavCommentsRead: []
			};
			var enableTable = this.getView().getModel("JM_EnableTable");

			var oModel = this.getOwnerComponent().getModel();
			var that = this;
			oModel.create("/KeyDataSet", oPayload, {
				success: function(oData) {
					console.log("oData Response while upload excel", oData);
					if (oData.NavErrors.results !== []) {
						that.fnSetErrorMessages(oData.NavErrors.results);
					}
					enableTable.setProperty("/enable", true);
					enableTable.refresh(true);
					that._buildDynamicTable(
						oData.NavGetInit.results
					);
					that.fnGetFieldValuesFromExcel(oData.NavGetInitVal.results);

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

				},
				error: function(error) {
					ErrorHandler.showCustomSnackbar("Excel Uploaded Have Error", "Error", that);
					console.log("oData Response error while upload excel", error);
				}
			});
		},
		fnSetErrorMessages: function(errorMessages) {

			var aMessages = errorMessages.filter(function(item) {
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
						fieldId: item.FieldId,
						ItemNo: item.SerialNo
					};
				});
			var oMsgModel = new sap.ui.model.json.JSONModel({
				messages: aMessages
			});

			this.getView().setModel(oMsgModel, "JM_MsgModel");
		},
		fnGetFieldValuesFromExcel: function(fields) {

			var aResult = fields || [];

			var oItemMap = {};

			aResult.forEach(function(oEntry) {

				var sItemNo = oEntry.ItemNo;

				if (!oItemMap[sItemNo]) {
					oItemMap[sItemNo] = {
						ItemNo: sItemNo
					};
				}
				if (oEntry.FnValue !== "undefined") {
					oItemMap[sItemNo][oEntry.Fnm] = oEntry.FnValue;
				} else {
					oItemMap[sItemNo][oEntry.Fnm] = "";
				}

			});

			var aRows = Object.keys(oItemMap).map(function(sKey) {
				return oItemMap[sKey];
			});

			console.log("Rows", aRows);

			this.getView().getModel("JM_TableModel").setProperty("/Rows", aRows);

			// Set header Plant field
			if (aRows.length > 0) {
				var sWerks = aRows[0].WERKS || aRows[0].WERK || "";

				var oWerks = this.getView().byId("ID_QIR_WERKS");
				var oWerksValue = oWerks.getValue();
				if (oWerks && !oWerksValue) {
					oWerks.setValue(sWerks);
					oWerks.setEditable(false);
					var oEnableModel = this.getView().getModel("JM_EnableModel");
					oEnableModel.setProperty("/enable", false);
					this.fnReadf4Cache("ID_QIR_WERKS", sWerks);
				}
			}

		},
		fnPrepareQIRPayload: function(aExcelData) {
			var oFieldModel = this.getView().getModel("JM_FieldModel");
			var aFields = oFieldModel.getProperty("/data") || [];

			var oPayload = {
				AppId: "QIRMC",
				Ind: "U",
				NavGetInitVal: [],
				NavErrors: [],
				NavKeyValues: []
			};

			var oUniqueMap = {};
			var aDuplicateRows = [];

			aExcelData.forEach(function(oExcelRow, iIndex) {

				var sMatnr = String(oExcelRow["Material Number"] || "").trim();
				var sWerk = String(oExcelRow["Plant"] || "").trim();
				var sVendor = String(oExcelRow["Vendor"] || "").trim();

				var sKey = [
					sMatnr,
					sWerk,
					sVendor
				].join("|");

				// Duplicate found
				if (oUniqueMap[sKey]) {

					aDuplicateRows.push({
						RowNo: iIndex + 1,
						MATNR: sMatnr,
						WERK: sWerk,
						LIEFERANT: sVendor
					});

					return;
				}

				oUniqueMap[sKey] = true;

				var sItemNo = String(
					Object.keys(oUniqueMap).length
				).padStart(10, "0");

				// MATNR
				oPayload.NavGetInitVal.push({
					ItemNo: sItemNo,
					Fnm: "MATNR",
					FnValue: sMatnr
				});

				// WERK
				oPayload.NavGetInitVal.push({
					ItemNo: sItemNo,
					Fnm: "WERK",
					FnValue: sWerk
				});

				// LIEFERANT
				oPayload.NavGetInitVal.push({
					ItemNo: sItemNo,
					Fnm: "LIEFERANT",
					FnValue: sVendor
				});

				// ------------------------
				// Dynamic Fields
				// ------------------------

				aFields.forEach(function(oField) {

					var sExcelColumn = oField.FmmDes;
					var sValue = String(oExcelRow[sExcelColumn]);

					oPayload.NavGetInitVal.push({
						ItemNo: String(iIndex + 1),

						Cnt: oField.Cnt,
						Werks: oField.Werks,
						Vwnm: oField.Vwnm,
						VwnmId: oField.VwnmId,
						VwnmSid: oField.VwnmSid,
						Heading: oField.Heading,

						Fnm: oField.Fnm,
						FmmDes: oField.FmmDes,
						FnmId: oField.FnmId,
						MdmId: oField.MdmId,

						Hd: oField.Hd,
						Dsply: oField.Dsply,
						Rqr: oField.Rqr,

						SapTable: oField.SapTable,
						TextTable: oField.TextTable,
						TableUi: oField.TableUi,

						TypFld: oField.TypFld,
						SearchHelp: oField.SearchHelp,

						FieldLength: oField.FieldLength,
						FieldDes: oField.FieldDes,
						FieldSize: oField.FieldSize,

						TransId: oField.TransId,
						FieldFormat: oField.FieldFormat,

						FnValue: sValue || "",

						RuleValue: oField.RuleValue,
						RuleText: oField.RuleText
					});

				});

			});
			if (aDuplicateRows.length > 0) {

				ErrorHandler.showCustomSnackbar(
					aDuplicateRows.length + " duplicate records removed",
					"Warning",
					this
				);

			}
			return oPayload;
		},
		fnPreviousItem: function() {

			var oModel = this.getView().getModel("JM_TableModel");
			var aRows = oModel.getProperty("/Rows") || [];

			if (aRows.length <= 1) {

				ErrorHandler.showCustomSnackbar(
					"No previous item available",
					"Information",
					this
				);

				return;
			}

			var iPrevIndex = this._iCurrentRowIndex - 1;

			if (iPrevIndex < 0) {

				ErrorHandler.showCustomSnackbar(
					"Already at first item",
					"Information",
					this
				);

				return;
			}

			this.fnLoadItemByIndex(iPrevIndex);
		},
		fnNextItem: function() {

			var oModel = this.getView().getModel("JM_TableModel");
			var aRows = oModel.getProperty("/Rows") || [];

			if (aRows.length <= 1) {

				ErrorHandler.showCustomSnackbar(
					"No next item available",
					"Information",
					this
				);

				return;
			}

			var iNextIndex = this._iCurrentRowIndex + 1;

			if (iNextIndex >= aRows.length) {

				ErrorHandler.showCustomSnackbar(
					"Already at last item",
					"Information",
					this
				);

				return;
			}

			this.fnLoadItemByIndex(iNextIndex);
		},
		fnLoadItemByIndex: function(iIndex) {

			var oModel = this.getView().getModel("JM_TableModel");
			var aRows = oModel.getProperty("/Rows") || [];

			if (!aRows.length) {
				ErrorHandler.showCustomSnackbar(
					"No Item Data Available",
					"Error",
					this
				);
				return;
			}

			var oRow = aRows[iIndex];

			if (!oRow) {
				return;
			}

			this._iCurrentRowIndex = iIndex;
			this._oSelectedHeaderRow = oRow;

			var oDocModel = this.getView().getModel("JM_DocTypeModel");

			oDocModel.setProperty(
				"/List",
				oRow.Attachments || []
			);

			this.getView().getModel("DialogModel").setProperty(
				"/SelectedItemNo",
				oRow.ItemNo
			);

			// Refresh item data if required
			var oItemModel = this.getView().getModel("JM_ItemModel");
			oItemModel.setProperty("/Rows", []);

			this._buildItemTable();
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
			var oTableModel = this.getView().getModel("JM_TableModel");

			oTableModel.setProperty(
				"/Rows/" + this._iCurrentRowIndex + "/Attachments",
				vRows
			);
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
		fnGetId: function(id) {
			return this.getView().byId(id);
		},
		handleMessagePopoverPress: function(oEvent) {
			this.fn_validateAndSubmitMass(oEvent, true);
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

			var oData = oEvent.getSource()
				.getBindingContext("JM_MsgModel")
				.getObject();

			console.log("Message Data", oData);

			var aRows = this.getView()
				.getModel("JM_TableModel")
				.getProperty("/Rows") || [];

			var iRowIndex = aRows.findIndex(function(oRow) {
				return String(oRow.ItemNo) === String(oData.ItemNo);
			});

			if (iRowIndex === -1) {
				return;
			}

			var oTable = this.byId("idDynamicTable");

			// Scroll to required row
			oTable.setFirstVisibleRow(iRowIndex);

			sap.ui.getCore().applyChanges();

			var sFieldName = oData.FieldName || oData.fieldName;

			if (!sFieldName) {

				if (this._oPopover) {
					this._oPopover.close();
				}

				return;
			}

			var aColumns = oTable.getColumns();

			var iColumnIndex = aColumns.findIndex(function(oColumn) {

				return oColumn.data("FieldName") === sFieldName;

			});

			if (iColumnIndex === -1) {

				console.log("Column not found for", sFieldName);

				return;
			}

			var that = this;

			setTimeout(function() {

				var aVisibleRows = oTable.getRows();

				var oUiRow = aVisibleRows.find(function(oRow) {

					var oContext = oRow.getBindingContext("JM_TableModel");

					if (!oContext) {
						return false;
					}

					return oContext.getPath() === "/Rows/" + iRowIndex;

				});

				if (!oUiRow) {

					console.log("Visible row not found");

					return;
				}

				var aCells = oUiRow.getCells();

				var oCell = aCells[iColumnIndex];

				if (oCell) {

					console.log("Focus Success");

					oCell.focus();

					if (oCell.setValueState) {

						oCell.setValueState("Error");
						oCell.setValueStateText(oData.title);

					}

				}

				if (that._oPopover) {
					that._oPopover.close();
				}

			}, 200);

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
		fn_validateAndSubmitMass: function(oEvent, noconfirmation) {

			var oPayload = this._buildMassValidationPayload();
			if (oPayload.NoDataFound) {
				ErrorHandler.showCustomSnackbar(i18n.getText("no_data_found_in_table"), "Error", this);
				return;
			}
			console.log("validation mass payload", oPayload);

			var oModel = this.getOwnerComponent().getModel();
			var that = this;

			oModel.create("/ValidateHeaderSet", oPayload, {

				success: function(oData) {
					console.log("Final Validation Result", oData);
					var oMessages = that._extractValidationMessages(oData);

					var bAllSuccess =
						oMessages.length === 0 ||
						oMessages.every(function(oMsg) {
							return oMsg.MsgType === "S";
						});

					if (bAllSuccess && !noconfirmation) {

						that._openConfirmDialog(
							"Confirmation",
							"Validation successful. Are you sure want to proceed?",
							function() {

								that.fn_submitMass();

							}
						);

					} else {

						that._openValidationMessageFragment(oMessages);

					}

				},

				error: function() {

					ErrorHandler.showCustomSnackbar(
						i18n.getText("validation_error"),
						"Error",
						that
					);

				}

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
						fieldId: item.FieldId,
						fieldName: item.FieldName,
						ItemNo: item.SerialNo
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
		_buildMassValidationPayload: function() {

			var aRows = this.getView()
				.getModel("JM_TableModel")
				.getProperty("/Rows") || [];

			var aMeta = this.getView()
				.getModel("JM_FieldModel")
				.getProperty("/data") || [];

			var aNavValidate = [];
			var iSerial = 1;
			console.log("table rows ", aMeta);
			if (aRows.length <= 0) {
				return {
					NoDataFound: "no_data_found"
				};
			}
			var that = this;
			aRows.forEach(function(oRow, iRowIndex) {

				aMeta.forEach(function(oField) {

					if (
						oField.TypFld === "L" ||
						oField.TypFld === "H" ||
						(oField.TableUi === "X" && oField.TypFld === "I")
					) {
						return;
					}

					aNavValidate.push({
						// ItemNo: oRow.ItemNo,
						Werks: oRow.WERKS || "",
						FieldId: oField.FnmId || "",
						ViewId: oField.Vwnm || "",
						FieldName: oField.Fnm || "",
						FieldValue: oField.Fnm === "WERK" ? that.getView().byId("ID_QIR_WERKS").getValue() : oRow[oField.Fnm],
						MsgType: "",
						Message: "",
						SerialNo: oRow.ItemNo
					});

				});

			});

			return {
				NavValHeader: aNavValidate
			};
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
		_openValidationMessageFragment: function(aMessages) {
			var oView = this.getView();
			var oMsgModel = new sap.ui.model.json.JSONModel({
				items: aMessages
			});

			oView.setModel(oMsgModel, "ValidationMsgModel");
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
		_buildMassPayload: function(sInd) {

			var aRows = this.getView()
				.getModel("JM_TableModel")
				.getProperty("/Rows") || [];

			var aMeta = this.getView()
				.getModel("JM_FieldModel")
				.getProperty("/data") || [];
			var vTransId = this.getOwnerComponent().getModel("JM_ContextModel").getProperty("/Transid");
			var vWiId = this.getOwnerComponent().getModel("JM_ContextModel").getProperty("/WiId");
			var oPayload = {
				Appid: "QIRMC",
				Transid: vTransId || "",
				WiId: vWiId || "",
				Ind: sInd,
				Werks: this.getView().byId("ID_QIR_WERKS").getValue(),
				NavFieldItems: [],
				NavAttachment: [],
				NavComment: [],
				NavFinal: []
			};
			var that = this;
			aRows.forEach(function(oRow) {

				/* -------------------------
				   Dynamic Fields
				------------------------- */
				aMeta.forEach(function(oField) {

					if (
						oField.TypFld === "L" ||
						oField.TypFld === "H"
					) {
						return;
					}

					oPayload.NavFieldItems.push({

						ItemNo: oRow.ItemNo,

						Fnm: oField.Fnm || "",
						FnmId: oField.FnmId || "",
						Vwnm: oField.Vwnm || "",
						// FieldValue: oField.Fnm === "WERK" ? that.getView().byId("ID_QIR_WERKS").getValue() : oRow[oField.Fnm],
						FnValue: oField.Fnm === "WERK" ? that.getView().byId("ID_QIR_WERKS").getValue() : oRow[oField.Fnm]
					});

				});

				/* -------------------------
				   Attachments
				------------------------- */
				if (oRow.Attachments && oRow.Attachments.length) {
					var i = 0;
					oRow.Attachments.forEach(function(oAtt) {
						i = i + 1;
						oPayload.NavAttachment.push({

							// SerialNo: i,
							ObjectId: oRow.ItemNo,
							FileName: oAtt.TagName || "",
							MimeType: oAtt.MimeType || "",
							// DocType
							FileSize: oAtt.Size || "",
							Xstring: oAtt.Xstring || "",
							CreatedBy: oAtt.CreatedBy
								// Created

						});

					});

				}

			});
			/* -------------------------
				Comments
			------------------------- */
			oPayload.NavComment = [];
			var vCommentsValue = this.getView().byId("id_textarea").getValue();

			oPayload.NavComment.push({
				"Comments": vCommentsValue
			});
			return oPayload;
		},
		fn_submitMass: function() {

			var oPayload = this._buildMassPayload("X");
			console.log("oPayload during submit", oPayload);
			var that = this;
			this.getOwnerComponent()
				.getModel()
				.create("/FieldHeaderSet", oPayload, {

					success: function(oData) {

						console.log("OData response final submit time", oData);

						if (oData.MsgType === "S" || oData.Final === "X") {

							gbusyDialog.close();

							// New Logic
							if (oData.Final === "X") {

								var aMessages = [];

								if (oData.NavFinal && oData.NavFinal.results) {

									aMessages = oData.NavFinal.results.map(function(oItem) {
										return {
											type: oItem.MsgType === "E" ? "Error" : oItem.MsgType === "W" ? "Warning" : oItem.MsgType === "S" ? "Success" : "Information",

											title: oItem.Message || "",
											// subtitle: oItem.MsgType === 'E' ? "Error" : "Success" || ""
											subtitle: oItem.SerialNo
										};
									});
									that.fnAddStatusColumn();
									var aRows = that.getView()
										.getModel("JM_TableModel")
										.getProperty("/Rows") || [];

									oData.NavFinal.results.forEach(function(oItem) {

										var oRow = aRows.find(function(r) {
											return String(r.ItemNo) === String(oItem.SerialNo);
										});

										if (oRow) {

											oRow.Status =
												oItem.MsgType === "S" ?
												"Created" :
												"Error";

											oRow.StatusMessage = oItem.Message;
										}

									});

									that.getView()
										.getModel("JM_TableModel")
										.refresh(true);
								}

								var oMsgModel = new sap.ui.model.json.JSONModel({
									Title: oData.Message || "Final Approval Result",
									messages: aMessages
								});

								that.getView().setModel(oMsgModel, "JM_FinalmsgModel");

								if (!that._oMessageDialog) {

									that._oMessageDialog = sap.ui.xmlfragment(
										that.getView().getId(),
										"MDM_QIR.Fragments.MultiSuccess",
										that
									);

									that.getView().addDependent(that._oMessageDialog);
								}

								that._oMessageDialog.open();

							} else {

								// Existing Success Popup

								var oPopupModel = new sap.ui.model.json.JSONModel({
									title: "Confirmation",
									text: oData.Message,
									positiveButton: "OK",
									positiveIcon: that.getView()
										.getModel("JM_ImageModel")
										.getProperty("/path") + "Continue.svg",
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
							}

						} else if (oData.MsgType === "E") {

							gbusyDialog.close();

							ErrorHandler.showCustomSnackbar(
								oData.Message,
								"Error",
								that
							);
						}
					},

					// success: function(oData) {

					// 	if (oData.MsgType === "S") {

					// 		var oPopupModel = new sap.ui.model.json.JSONModel({
					// 			title: "Confirmation",
					// 			text: oData.Message,
					// 			positiveButton: "OK",
					// 			positiveIcon: that.getView()
					// 				.getModel("JM_ImageModel")
					// 				.getProperty("/path") + "Continue.svg",
					// 			Indicator: "UWL"
					// 		});

					// 		that.getView().setModel(oPopupModel, "JM_Popup");

					// 		if (!that.oSuccessdialog) {

					// 			that.oSuccessdialog = sap.ui.xmlfragment(
					// 				that.getView().getId(),
					// 				"MDM_QIR.Fragments.SucessDialog",
					// 				that
					// 			);

					// 			that.getView().addDependent(that.oSuccessdialog);
					// 		}

					// 		gbusyDialog.close();
					// 		that.oSuccessdialog.open();

					// 	} else if (oData.MsgType === "E") {

					// 		gbusyDialog.close();

					// 		ErrorHandler.showCustomSnackbar(
					// 			oData.Message,
					// 			"Error",
					// 			that
					// 		);
					// 	}

					// },

					error: function() {
						gbusyDialog.close();
						ErrorHandler.showCustomSnackbar(i18n.getText("Submit_failed"), "Error", that);
						sap.ui.core.UIComponent.getRouterFor(that).navTo("UWL");
					}

				});

		},
		fn_saveasdraftconfirmation: function() {
			var that = this;
			that._openConfirmDialog(
				"Confirmation",
				"Validation successful. Are you sure want to proceed?",
				function() {

					that.fn_saveMassDraft();

				}
			);

		},
		fn_saveMassDraft: function() {

			var oPayload = this._buildMassPayload("D");
			var that = this;
			this.getOwnerComponent()
				.getModel()
				.create("/FieldHeaderSet", oPayload, {

					success: function(oData) {

						if (oData.MsgType === "S") {

							var oPopupModel = new sap.ui.model.json.JSONModel({
								title: "Confirmation",
								text: oData.Message,
								positiveButton: "OK",
								positiveIcon: that.getView()
									.getModel("JM_ImageModel")
									.getProperty("/path") + "Continue.svg",
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

					},

					error: function() {
						gbusyDialog.close();
						ErrorHandler.showCustomSnackbar(i18n.getText("Submit_failed"), "Error", that);
						sap.ui.core.UIComponent.getRouterFor(that).navTo("Search");
					}

				});

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
					ItemNo: item.ObjectId || "",
					AttachmentNo: item.SerialNo || (index + 1),
					TagName: item.FileName || "",
					MimeType: item.MimeType || "",
					DocType: item.DocType || "Default",
					Size: item.FileSize || "",
					ObjectId: item.ObjectId || "",
					Xstring: item.Xstring || "",
					CreatedBy: item.CreatedBy || ""
				};

			});

			var oModel = new sap.ui.model.json.JSONModel({
				List: aFormatted
			});
			console.log("attachment", aFormatted);
			this.getView().setModel(oModel, "JM_DocTypeModel");

			// Store attachments inside table rows
			var oTableModel = this.getView().getModel("JM_TableModel");
			var aRows = oTableModel.getProperty("/Rows") || [];

			aRows.forEach(function(oRow) {

				oRow.Attachments = aFormatted.filter(function(oAtt) {

					return String(oAtt.ItemNo) === String(oRow.ItemNo);

				});

			});

			oTableModel.setProperty("/Rows", aRows);

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
		fn_DownloadExcel: function() {

			var aRows = this.getView()
				.getModel("JM_TableModel")
				.getProperty("/Rows") || [];

			if (aRows.length === 0) {
				ErrorHandler.showCustomSnackbar(
					"No data available for download",
					"Information",
					this
				);
				return;
			}

			var aMetaFields = this.getView()
				.getModel("JM_FieldModel")
				.getProperty("/data") || [];

			var aHeaders = [];
			var aKeys = [];

			// Fixed Columns
			aHeaders.push("Item No");
			aKeys.push("ItemNo");

			aHeaders.push("Material");
			aKeys.push("MATNR");

			aHeaders.push("Plant");
			aKeys.push("WERK");

			aHeaders.push("Vendor");
			aKeys.push("LIEFERANT");

			// Dynamic Columns
			aMetaFields.forEach(function(oField) {

				if (
					oField.TableUi === "X" ||
					oField.Fnm === "MATNR" ||
					oField.Fnm === "WERK" ||
					oField.Fnm === "LIEFERANT"
				) {
					return;
				}

				aHeaders.push(oField.FmmDes || oField.Fnm);
				aKeys.push(oField.Fnm);

			});

			var aSheetData = [];

			// Header
			aSheetData.push(aHeaders);

			// Data
			aRows.forEach(function(oRow) {

				var aExcelRow = [];

				aKeys.forEach(function(sKey) {

					var vValue = oRow[sKey];

					if (vValue === undefined || vValue === null) {
						vValue = "";
					}

					// Checkbox fields
					if (vValue === "X") {
						vValue = "YES";
					}

					aExcelRow.push(vValue);

				});

				aSheetData.push(aExcelRow);

			});

			var oWorksheet = XLSX.utils.aoa_to_sheet(aSheetData);

			var oWorkbook = XLSX.utils.book_new();

			XLSX.utils.book_append_sheet(
				oWorkbook,
				oWorksheet,
				"Mass_Create"
			);

			XLSX.writeFile(
				oWorkbook,
				"Mass_Create_QIR_Download.xlsx"
			);

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

			if (this.vAppId === "QIRMC") {
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

				that._openConfirmDialog(
					"Confirmation",
					"Are you sure you want to reject this requested transaction ID?",
					function() {

						that.fnRejectSubmit();

					}
				);
				// this._openConfirmDialog(
				// 	"Confirmation",
				// 	"Are you sure you want to reject this requested transaction ID?",
				// 	function(bConfirmed) {
				// 		if (bConfirmed) {
				// 			that.fnRejectSubmit();
				// 		}
				// 	}
				// );
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

			if (this.vAppId === "QIRMC") {
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
			var oAttachModel = oView.getModel("JM_DocTypeModel");
			if (oAttachModel) {
				oAttachModel.setData(null);
			}

			oView.byId("id_fileNameInput").setValue(null);

			var fieldModel = oView.getModel("JM_FieldModel");
			if (fieldModel) {
				fieldModel.setData(null);
			}
			this.byId("ID_QIR_WERKS").setValue("");
			this.byId("ID_QIR_WERKSDES").setValue("");
			this.byId("id_textarea").setValue("");
			this.byId("id_comments").destroyItems();
		},
		fnCloseErrorSuccessDialog: function() {

			if (this._oMessageDialog) {
				this._oMessageDialog.close();
				this._oMessageDialog.destroy();
				this._oMessageDialog = null;
			}

			// this.getOwnerComponent().getRouter().navTo("Search");

		},
		fnLiveErrorChange: function(oEvent) {
			var oControl = oEvent.getSource();
			if (oControl && oControl.setValueState) {
				oControl.setValueState(sap.ui.core.ValueState.None);
				oControl.setValueStateText("");
			}
		}
	});
});