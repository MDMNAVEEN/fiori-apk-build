sap.ui.define([
	"sap/ui/model/FilterOperator",
	"sap/ui/model/Filter",
	"Vendor_Screen/controller/ErrorHandler"
], function(Filterperator, Filter, ErrorHandler) {
	"use strict";
	return {
		// fnKeyDataBinding: function(aKeyData, oController) {

		// 	var oModel = oController.getOwnerComponent().getModel("JM_KEYDATA");

		// 	if (!oModel) {
		// 		oModel = new sap.ui.model.json.JSONModel({});
		// 		oController.getOwnerComponent().setModel(oModel, "JM_KEYDATA");
		// 	}
		// 	var vType = oController.vBPCategory;
		// 	if (vType === "Organization") {
		// 		vType = "O";
		// 	} else if (vType === "Person") {
		// 		vType = "P";
		// 	} else if (vType === "Group") {
		// 		vType = "G";
		// 	}
		// 	oModel.setProperty("/BuType", vType);
		// 	oModel.setProperty("/Pan", oController.vPan);
		// 	oModel.setProperty("/Country", oController.vCountry);
		// 	oModel.setProperty("/City", oController.vCity);
		// 	oModel.setProperty("/PostalCode", oController.vPostal);
		// 	oModel.setProperty("/Region", oController.vRegion);

		// 	oModel.setProperty("/Name1", oController.vName1);
		// 	oModel.setProperty("/Name2", oController.vName2);
		// 	oModel.setProperty("/Email", oController.vEmail);
		// 	oModel.setProperty("/Mobile", oController.vMobile);
		// 	oModel.setProperty("/Pan", oController.vPan);
		// 	oModel.setProperty("/Stcd3", oController.vGst);

		// 	var oData = oModel.getData();

		// 	// FNM_ID → JM_KEYDATA mapping
		// 	var mFieldMap = {

		// 		KID_ACC: {
		// 			value: "AccGroup",
		// 			desc: "AccGroupDes"
		// 		},

		// 		KID_BPCAT: {
		// 			value: "BPCatDesc"
		// 		},

		// 		KID_BPROLE: {
		// 			value: "BPRole"
		// 		},

		// 		KID_BPTYPE: {
		// 			value: "BPType",
		// 			desc: "BPTypeDes"
		// 		},

		// 		KID_FIKTD: {
		// 			value: "ReconAcc"
		// 		},

		// 		KID_WERKS: {
		// 			value: "Plant",
		// 			desc: "PlantDes"
		// 		},

		// 		KID_BUKRS: {
		// 			value: "CompCode",
		// 			desc: "CompCodeDes"
		// 		},

		// 		KID_VKORG: {
		// 			value: "SalesOrg",
		// 			desc: "SalesOrgDesc"
		// 		},

		// 		KID_VTWEG: {
		// 			value: "DistrChannel",
		// 			desc: "DistrchannelDesc"
		// 		},

		// 		KID_SPART: {
		// 			value: "Division",
		// 			desc: "DivisionDesc"
		// 		},

		// 		KID_BPGROUP: {
		// 			value: "BPGroup",
		// 			desc: "BPGroupDes"
		// 		},

		// 		KID_VKBUR: {
		// 			value: "Salesoffice",
		// 			desc: "SalesofficeDesc"
		// 		},
		// 		KID_EKORG: {
		// 			value: "PurchOrg",
		// 			desc: "PurchOrgDes"
		// 		},
		// 		KID_ACC_V: {
		// 			value: "AccGroup",
		// 			desc: "AccGroupDes"
		// 		},
		// 		KID_BPGROUP_V: {
		// 			value: "BPGroup",
		// 			desc: "BPGroupDes"
		// 		},
		// 	};

		// 	aKeyData.forEach(function(o) {

		// 		var oMap = mFieldMap[o.FnmId];
		// 		if (!oMap) {
		// 			return;
		// 		}

		// 		if (oMap.value) {

		// 			var vValue = o.Value || "";

		// 			// Special handling for BP Category
		// 			if (o.FnmId === "KID_BPCAT") {
		// 				if (vValue === "P") {
		// 					vValue = "Person";
		// 				} else if (vValue === "O") {
		// 					vValue = "Organization";
		// 				} else if (vValue === "G") {
		// 					vValue = "Group";
		// 				}
		// 			}

		// 			oData[oMap.value] = vValue;
		// 		}

		// 		if (oMap.desc) {
		// 			oData[oMap.desc] = o.Description || "";
		// 		}
		// 	});

		// 	oModel.setData(oData);
		// 	oModel.refresh(true);
		// },
		fnLoadDynamicFields: function(vIntiatorContainer, oDataResults, oController, bpcat) {
			var groupedByView = [];
			var oFieldData = {};
			var oFieldDes = {};
			var oFieldMetaMap = {};
			var inputLabel;
			// oDataResults = oDataResults.filter(function(oItem) {
			// 	return oItem.BpType === bpcat || oItem.BpType === "";
			// });
			var oJsonModel = new sap.ui.model.json.JSONModel(oFieldData);
			oController.getView().setModel(oJsonModel, "JM_FieldValue");
			var oKeyDataModel = oController.getOwnerComponent().getModel("JM_KEYDATA");
			var oKeyData = oKeyDataModel ? oKeyDataModel.getData() : {};

			var mKeyDataFieldMap = {
				TITLE: "Title",
				NAME_FIRST: "Name1",
				NAME_LAST: "Name2",
				NAME_GRP1: "Name1",
				NAME_GRP2: "Name2",
				NAME_ORG1: "Name1",
				NAME_ORG2: "Name2",
				POST_CODE1: "PostalCode",
				CITY1: "City",
				COUNTRY: "Country",
				REGION: "Region",
				MOB_NUMBER: "Mobile",
				SMTP_ADDR: "Email",
				VKBUR: "Salesoffice"
			};

			var mKeyDataDescMap = {
				TITLE: "TitleDes", //Added by srikanth
				VKBUR: "SalesofficeDesc",
				COUNTRY: "CountryDesc",
				REGION: "RegionDesc"
			};

			oController._wfResults = JSON.parse(JSON.stringify(oDataResults));

			var oValues = oController
				.getView().getModel("JM_FieldValue")
				.getData();

			oController.initialMultiplePayload =
				this.fnBuildMultiplePayload(
					oController._wfResults,
					oValues
				);

			// // Added by srikanth 

			// var RowFragIds = ["X400_ID", "X400_ID_IN", "IBAN", "BANK", "CARD", "ADDR"];

			// var oView = oController.getView();
			// var oPayload = JSON.parse(JSON.stringify(oController.initialMultiplePayload || {}));

			// Object.keys(oController.initialMultiplePayload).forEach(function(vMultipleId) {

			// 	if (!oPayload[vMultipleId] ||
			// 		!oPayload[vMultipleId][0] ||
			// 		!oPayload[vMultipleId][0].fields) {
			// 		// continue;
			// 		return;
			// 	}

			// 	var vFields = oPayload[vMultipleId][0].fields;

			// 	var sModelName = "JM_" + vMultipleId;
			// 	var oSubIdModel = oView.getModel(sModelName);

			// 	oController.TableModelSet.push(sModelName);

			// 	if (!oSubIdModel) {
			// 		if (RowFragIds.includes(vMultipleId)) {
			// 			var aLabels = [];
			// 			var aRows = [];
			// 			var oRowMap = {};

			// 			for (var i = 0; i < vFields.length; i++) {

			// 				var field = vFields[i];

			// 				if (field.TypFld !== "I" && field.TypFld !== "L") {
			// 					continue;
			// 				}

			// 				var colId = field.FnmId;
			// 				var sTableRow = field.TableRow;

			// 				if (!aLabels.some(function(l) {
			// 						return l.id === colId;
			// 					})) {

			// 					aLabels.push({
			// 						id: colId,
			// 						type: field.TypFld,
			// 						Dname: field.Dname,
			// 						Fnm: field.Fnm,
			// 						viewId: field.VwnmId,
			// 						subid: field.VwnmSid,
			// 						cnt: field.Cnt,
			// 						editable: field.TypFld === "I",
			// 						value: field.FmmDes || field.Heading || "",
			// 						valueHlp: !!field.SearchHelp,
			// 						SearchHelp: field.SearchHelp || "",
			// 						Multiple: field.Multiple,
			// 						MultipleId: field.MultipleId,
			// 						RuleValue: field.RuleValue,
			// 						RuleText: field.RuleText,
			// 						Changed: field.Changed,
			// 						VwnmSid: field.VwnmSid,
			// 						tableRow: field.TableRow,
			// 					});
			// 				}

			// 				if (!oRowMap[sTableRow]) {
			// 					oRowMap[sTableRow] = {};
			// 				}
			// 				// if (sTableRow !== "00") {
			// 				oRowMap[sTableRow][colId] = {
			// 					value: field.RuleValue || "",
			// 					editable: field.TypFld === "I",
			// 					valueHlp: !!field.SearchHelp
			// 				};

			// 				// }
			// 			}

			// 			// Convert row map to array

			// 			for (var key in oRowMap) {
			// 				// if (key !== "00")
			// 				aRows.push(oRowMap[key]);
			// 			}

			// 			var oJsonModel = new sap.ui.model.json.JSONModel({
			// 				labels: aLabels,
			// 				rows: aRows
			// 			});

			// 		} else {
			// 			var aColumns = [];
			// 			var aInputs = [];

			// 			var vRawData = vFields.map(function(f) {
			// 				var f4status1 = f.SearchHelp !== "";
			// 				return {
			// 					id: f.FnmId,
			// 					type: f.TypFld,
			// 					Dname: f.Dname,
			// 					Fnm: f.Fnm,
			// 					viewId: f.VwnmId,
			// 					valueHlp: f4status1,
			// 					SearchHelp: f.SearchHelp,
			// 					subid: f.MultipleId,
			// 					cnt: f.Cnt,
			// 					RuleValue: f.RuleValue,
			// 					RuleText: f.RuleText,
			// 					tableRow: f.TableRow,
			// 					value: f.FmmDes,
			// 					editable: f.Dsply === "",
			// 					Changed: f.Changed,
			// 					Multiple: f.Multiple,
			// 					MultipleId: f.MultipleId,
			// 					VwnmSid: f.VwnmSid
			// 				};
			// 			});

			// 			for (var i = 0; i < vRawData.length; i++) {
			// 				if (vRawData[i].type === "L") {
			// 					aColumns.push(vRawData[i]);
			// 				} else if (vRawData[i].type === "I" || vRawData[i].type === "C" || vRawData[i].type === "R") {
			// 					aInputs.push(vRawData[i]);
			// 				}
			// 			}
			// 			var uniqueInputs = [];
			// 			var seenMap = {};

			// 			for (var i = 0; i < aInputs.length; i++) {
			// 				var item = aInputs[i];
			// 				var key = item.cnt + "_" + item.id;

			// 				if (!seenMap[key]) {
			// 					seenMap[key] = true;
			// 					uniqueInputs.push(item);
			// 				}
			// 			}
			// 			for (var j = 0; j < Math.min(aColumns.length, uniqueInputs.length); j++) {
			// 				var tempId = aColumns[j].id;
			// 				aColumns[j].id = uniqueInputs[j].id;
			// 				uniqueInputs[j].id = tempId;
			// 				aColumns[j].valueHlp = uniqueInputs[j].valueHlp;
			// 				aColumns[j].editable = uniqueInputs[j].editable;
			// 				aColumns[j].type = uniqueInputs[j].type;
			// 				aColumns[j].Dname = uniqueInputs[j].Dname;
			// 				aColumns[j].SearchHelp = uniqueInputs[j].SearchHelp;
			// 				aColumns[j].Multiple = uniqueInputs[j].Multiple;
			// 				aColumns[j].MultipleId = uniqueInputs[j].MultipleId;
			// 			}

			// 			var inputValue = this.fnGroupByTableRow(aInputs || []);
			// 			var aFormattedRows = [];
			// 			var tableRowKeys = Object.keys(inputValue);
			// 			for (var k = 0; k < tableRowKeys.length; k++) {
			// 				var rowKey = tableRowKeys[k];
			// 				var aInputsForRow = inputValue[rowKey];
			// 				var row = {};
			// 				var isChanged = "";

			// 				var hasData = false;
			// 				aColumns.forEach(function(col) {
			// 					var input = aInputsForRow.find(function(inp) {
			// 						return inp.Fnm === col.Fnm;
			// 					});
			// 					if (input) {
			// 						if (col.type === "R") {
			// 							var val = input.RuleValue === "X" ? "X" : "";
			// 							row[col.id] = {
			// 								value: val,
			// 								editable: input.editable !== false,
			// 								valueHlp: input.valueHlp || false
			// 							};
			// 							if (val) {
			// 								hasData = true;
			// 							}
			// 						} else if (col.type === "C") {
			// 							var val = input.RuleValue === "X" ? "X" : "";
			// 							row[col.id] = {
			// 								value: val,
			// 								editable: input.editable !== false,
			// 								valueHlp: input.valueHlp || false
			// 							};
			// 							if (val) {
			// 								hasData = true;
			// 							}
			// 						} else {
			// 							var val = (input.RuleValue || "").trim();
			// 							row[col.id] = {
			// 								value: val,
			// 								editable: input.editable !== false,
			// 								valueHlp: input.valueHlp || false
			// 							};

			// 							if (val) {
			// 								hasData = true;
			// 							}
			// 						}

			// 						row[col.id + "_VS"] = "None";
			// 						row[col.id + "_VST"] = "";

			// 						if (input.Changed === "X") {
			// 							isChanged = "X";
			// 						}

			// 					} else {

			// 						if (col.type === "R") {
			// 							row[col.id] = {
			// 								value: "",
			// 								editable: false,
			// 								valueHlp: false
			// 							};
			// 						} else {
			// 							row[col.id] = {
			// 								value: "",
			// 								editable: false,
			// 								valueHlp: false
			// 							};
			// 						}

			// 						row[col.id + "_VS"] = "None";
			// 						row[col.id + "_VST"] = "";
			// 					}
			// 				});
			// 				row["Changed"] = isChanged;
			// 				if (hasData) {
			// 					aFormattedRows.push(row);
			// 				}
			// 			}

			// 			// Create fresh model only for initial load
			// 			var oJsonModel = new sap.ui.model.json.JSONModel({
			// 				labels: aColumns,
			// 				rows: aFormattedRows
			// 			});

			// 		}

			// 		oJsonModel.setDefaultBindingMode(sap.ui.model.BindingMode.TwoWay);
			// 		oView.setModel(oJsonModel, sModelName);

			// 		oController._multipleValueCache[vMultipleId] =
			// 			JSON.parse(JSON.stringify({
			// 				labels: aLabels || aColumns,
			// 				rows: aRows || aFormattedRows
			// 			}));
			// 	}
			// }.bind(this));

			// // EOC

			var oJsonModel1 = new sap.ui.model.json.JSONModel(oFieldDes);
			oController.getView().setModel(oJsonModel1, "JM_FieldDes");

			oDataResults.forEach(function(field) {
				var group = groupedByView.find(function(g) {
					return g.viewName === field.Vwnm;
				});

				if (!group) {
					group = {
						viewName: field.Vwnm,
						viewId: field.VwnmId,
						fields: []
					};
					groupedByView.push(group);
				}
				group.fields.push(field);
			});

			groupedByView.forEach(function(group) {
				var viewName = group.viewName;
				var viewId = group.viewId;
				var viewFields = group.fields;

				oController.ViewIdArray.push(viewId);
				var panelHeader = this.fnCreatePannelHeader(viewName, viewId, oController);
				var gridContainer = this.fnCreateGridContainer(viewId, oController);

				var groupedBySubId = [];

				viewFields.forEach(function(field) {
					var subGroup = groupedBySubId.find(function(sg) {
						return sg.subId === field.VwnmSid;
					});
					if (!subGroup) {
						subGroup = {
							subId: field.VwnmSid,
							fields: []
						};
						groupedBySubId.push(subGroup);
					}
					subGroup.fields.push(field);
				});
				groupedBySubId.forEach(function(subGroup) {
					var subFields = subGroup.fields;
					var tablecheckfield = subFields[0];

					if (tablecheckfield.TableUi !== "X" && tablecheckfield.Hd !== "" && tablecheckfield.MultipleId === "") {
						var subHeading = this.fnCreateSubHeadding(tablecheckfield.Heading, oController, tablecheckfield.VwnmSid);
						gridContainer.addContent(subHeading);
					}
					var fieldCounter = 0;
					for (var i = 0; i < subFields.length; i++) {
						var field = subFields[i];
						if (field.Multiple === "" && field.MultipleId !== "") {
							continue;
						}
						var f4status = field.SearchHelp !== "";
						if (field.TableUi === "X") {
							var tableData = [];
							while (i < subFields.length && subFields[i].TableUi === "X") {
								var tf = subFields[i];
								if (tf.TypFld === "H" && tf.MultipleId === "") {
									var tableid = tf.VwnmSid;
									var tableSubHeading = this.fnCreateTableSubheadding(tf.Heading, tableid, oController);
									gridContainer.addContent(tableSubHeading);
								} else {
									var f4status1 = tf.SearchHelp !== "";
									tableData.push({
										id: tf.FnmId,
										type: tf.TypFld,
										Dname: tf.Dname,
										Fnm: tf.Fnm,
										viewId: tf.VwnmId,
										valueHlp: f4status1,
										SearchHelp: tf.SearchHelp,
										subid: tf.VwnmSid,
										cnt: tf.Cnt,
										RuleValue: tf.RuleValue,
										RuleText: tf.RuleText,
										tableRow: tf.TableRow,
										value: tf.FmmDes,
										editable: tf.Dsply === "",
										Changed: tf.Changed,
										Multiple: tf.Multiple,
										MultipleId: tf.MultipleId
									});
								}
								oFieldMetaMap[tf.FnmId] = {
									fieldId: tf.FnmId,
									fnm: tf.Fnm,
									viewId: tf.VwnmId,
									viewSubId: tf.VwnmSid,
									fieldType: tf.TypFld,
									f4Type: tf.SearchHelp,
									Description: tf.FmmDes,
									TableUi: tf.TableUi,
									require: tf.Rqr || "",
									maxLength: tf.FieldLength || "0",
									decimal: tf.FieldDec || "0",
									SearchHelp: tf.SearchHelp,
									SubViewName: tablecheckfield.Heading,
									viewName: viewName
								};
								i++;
							}
							i--;
							var table = this.fnCreateDynamicTable(tableData, tableid, oController);
							gridContainer.addContent(table);
							if (viewId === "ID_VMGAT") {
								var oTextArea = new sap.m.TextArea({
									id: "ID_VMGAT_REMARKS",
									value: "{JM_FieldValue>/VMGAT_REMARKS}",
									rows: 4,
									width: "100%",
									editable: false,
									placeholder: "Enter remarks",
									liveChange: oController.fnRemarksLiveChange.bind(oController)
								});

								var oTextAreaVBox = new sap.m.VBox({
									items: [
										new sap.m.Label({
											text: "Remarks"
										}),
										oTextArea
									],
									layoutData: new sap.ui.layout.GridData({
										span: "L12 M12 S12"
									})
								}).addStyleClass("sapUiSmallMarginBegin sapUiSmallMarginTop");

								gridContainer.addContent(oTextAreaVBox);
							}
							var mTableButtonConfig = {
								ID_CMGPAYV1: {
									text: "Bank Data",
									type: "BANK"
								},
								ID_CMGPAYV2: {
									text: "Card Details",
									type: "CARD"
								},
								ID_VMGPAYV1: {
									text: "Bank Data",
									type: "BANK"
								},
								ID_VMGPAYV2: {
									text: "Card Details",
									type: "CARD"
								},
								ID_VMGAOV1: {
									text: "Create",
									type: "ADDR"
								},
								ID_CMGAOV1: {
									text: "Create",
									type: "ADDR"
								}
							};

							var oConfig = mTableButtonConfig[tableid];

							if (oConfig) {
								gridContainer.addContent(
									new sap.m.Button({
										text: oConfig.text,
										press: function(oEvent) {

											var oTable = sap.ui.getCore().byId(tableid);
											var iIndex = oTable.getSelectedIndex();
											if (iIndex < 0) {
												ErrorHandler.showCustomSnackbar("Please select a row first", "Information", oController);
												return;
											}
											var oCtx = oTable.getContextByIndex(iIndex);
											oController.selectedRowData = oCtx.getObject();
											oController.selectedRowPath = oCtx.getPath().split("/").pop();
											oController.fragmentMode = "ROW_DETAILS";
											oController.fnMaintainMultiple(oConfig.type);
										}.bind(oController)
									}).addStyleClass("cl_iconBtn cl_PrimaryButton sapUiSmallMarginBegin ")
								);
							}

							continue;
						}

						var require = field.Rqr === "X";
						var fieldId = field.FnmId;
						if (field.TypFld !== "C") {
							inputLabel = this.fnCreateInputLabel(field.FmmDes, require, fieldId, oController);
						}
						var fieldControl;

						if (field.SearchHelp === "T") {
							var datePicker = this.fnCreateDatePickerField(fieldId, field.Dsply, oController, field.Changed);
							if (field.RuleValue) {
								var sDate = field.RuleValue;
								var sDateFormatted = sDate.replace(/-/g, "");
								oFieldData[fieldId] = sDateFormatted;

								var oDP = sap.ui.getCore().byId(fieldId);
								if (oDP && oDP.isA("sap.m.DatePicker")) {
									// var jsDate = new Date(
									// 	parseInt(sDate.substring(0, 4), 10),
									// 	parseInt(sDate.substring(4, 6), 10) - 1,
									// 	parseInt(sDate.substring(6, 8), 10)
									// );

									if (sDate) {

										if (sDate.length > 8) {
											sDate = sDate.substring(0, 8);
										}
										var year = parseInt(sDate.substring(0, 4), 10);
										var month = parseInt(sDate.substring(4, 6), 10) - 1;
										var day = parseInt(sDate.substring(6, 8), 10);

										var jsDate = new Date(year, month, day);
									}
									if (!isNaN(jsDate.getTime())) {
										oDP.setDateValue(jsDate);
									}
								}
							} else {
								oFieldData[fieldId] = "";
							}

							oFieldMetaMap[fieldId] = {
								fieldId: fieldId,
								fnm: field.Fnm,
								viewId: field.VwnmId,
								fieldType: field.TypFld,
								require: field.Rqr,
								f4Type: field.SearchHelp,
								maxLength: field.FieldLength,
								decimal: field.FieldDec,
								Description: field.FmmDes,
								TableUi: field.TableUi,
								SearchHelp: field.SearchHelp,
								SubViewName: tablecheckfield.Heading,
								viewName: viewName
							};
							var errorField = this.fnCreateErrorField(fieldId);
							fieldControl = new sap.m.VBox({
								items: [inputLabel, datePicker, errorField],
								layoutData: new sap.ui.layout.GridData({
									span: "L3 M3 S12"
								})
							}).addStyleClass("sapUiSmallMarginBegin");
						} else if (field.TypFld === "C") {
							group = [];
							while (i < subFields.length && subFields[i].TypFld === "C") {
								group.push(subFields[i]);
								i++;
							}
							i--;

							for (var j = 0; j < group.length; j += 2) {
								var pair = group.slice(j, j + 2);
								var hboxItems = [];
								pair.forEach(function(cbField, idx) {
									var cbRequire = cbField.Rqr === "X";
									var cbFieldId = cbField.FnmId;
									inputLabel = this.fnCreateInputLabel(cbField.FmmDes, cbRequire, cbFieldId, oController);
									var checkbox = this.fnCreateCheckBoxfield(cbFieldId, cbField.Dsply, oController, cbField.Changed, "");
									var errorField2 = this.fnCreateErrorField(cbFieldId, oController);
									var state = (cbField.RuleValue === "X") ? true : false;
									oFieldData[cbFieldId] = state;
									oFieldMetaMap[cbFieldId] = {
										fieldId: cbFieldId,
										fnm: cbField.Fnm,
										viewId: cbField.VwnmId,
										viewSubId: cbField.VwnmSid,
										fieldType: cbField.TypFld,
										require: cbField.Rqr,
										f4Type: cbField.SearchHelp,
										maxLength: cbField.FieldLength,
										decimal: cbField.FieldDec,
										Description: cbField.FmmDes,
										SearchHelp: cbField.SearchHelp,
										SubViewName: tablecheckfield.Heading,
										viewName: viewName
									};
									var cbVBox = new sap.m.VBox({
										items: [inputLabel, checkbox, errorField2],
										width: pair.length === 2 ? "50%" : "100%"
									}).addStyleClass("sapUiSmallMarginBegin");
									if (pair.length === 2 && idx === 0) {
										cbVBox.addStyleClass("sapUiNoMarginEnd");
									}
									hboxItems.push(cbVBox);
								}.bind(this));
								fieldControl = new sap.m.HBox({
									items: hboxItems,
									justifyContent: "Start",
									alignItems: "Start",
									layoutData: new sap.ui.layout.GridData({
										span: "L3 M3 S12"
									})
								});
								gridContainer.addContent(fieldControl);
								fieldCounter++;
							}
							continue;
						} else {
							var inputField = f4status ? this.fnCreateF4InputField(this.fnWidthForInputFields(field.FieldLength, field.FieldSize),
								fieldId,
								field.Fnm,
								Number(field.FieldLength), require, field.FieldDec, field.Dsply, field.FieldFormat, oController, field.Changed, field.FieldSize
							) : this.fnCreateInputField(
								fieldId,
								Number(field.FieldLength),
								require,
								field.FieldDec, field.Dsply, field.FieldFormat, oController, field.Changed, field.Multiple, field.MultipleId);
							var errorField1 = this.fnCreateErrorField(fieldId, oController);
							var sKeyField = mKeyDataFieldMap[field.Fnm];
							var sKeyValue = sKeyField ? oKeyData[sKeyField] : undefined;

							if (sKeyValue !== undefined && sKeyValue !== null && sKeyValue !== "") {
								oFieldData[fieldId] = sKeyValue;
							} else {
								oFieldData[fieldId] = field.RuleValue ? field.RuleValue.trimStart() : "";
							}

							var sDescKeyField = mKeyDataDescMap[field.Fnm];
							var sDescValue = sDescKeyField ? oKeyData[sDescKeyField] : undefined;

							if (sDescValue !== undefined && sDescValue !== null && sDescValue !== "") {
								oFieldDes[fieldId] = sDescValue;
							} else {
								oFieldDes[fieldId] = field.RuleText || "";
							}
							oFieldMetaMap[fieldId] = {
								fieldId: fieldId,
								fnm: field.Fnm,
								viewId: field.VwnmId,
								viewSubId: field.VwnmSid,
								fieldType: field.TypFld,
								require: field.Rqr,
								f4Type: field.SearchHelp,
								maxLength: field.FieldLength,
								decimal: field.FieldDec,
								Description: field.FmmDes,
								TableUi: field.TableUi,
								SearchHelp: field.SearchHelp,
								SubViewName: tablecheckfield.Heading,
								viewName: viewName
							};
							fieldControl = new sap.m.VBox({
								items: [inputLabel, inputField, errorField1],
								layoutData: new sap.ui.layout.GridData({
									span: "L3 M3 S12"
								})
							}).addStyleClass("sapUiSmallMarginBegin");
						}
						gridContainer.addContent(fieldControl);
						fieldCounter++;
						if (fieldCounter % 4 === 0) {
							var hBox = new sap.m.HBox({});
							gridContainer.addContent(hBox);
						}
					}
				}.bind(this));
				var oVBoxMain = new sap.m.VBox({
					id: oController.createId(viewId),
					items: [panelHeader, gridContainer]
				}).addStyleClass("sapUiSmallMarginTop");
				vIntiatorContainer.addItem(oVBoxMain);
			}.bind(this));

			var oBPCNDataModel = new sap.ui.model.json.JSONModel();
			oBPCNDataModel.setData({
				FieldMeta: oFieldMetaMap
			});
			oController.getView().setModel(oBPCNDataModel, "JM_BPCNkeyModel");
			oController.fieldMetaMap = oFieldMetaMap;

			var oInitialValues = JSON.parse(
				JSON.stringify(oController.getView().getModel("JM_FieldValue").getData())
			);

			var oJsonModel2 = new sap.ui.model.json.JSONModel(oInitialValues);
			oController.getView().setModel(oJsonModel2,
				"JM_InitialBindingValue");

			// Added by srikanth 
			// var result = {};
			// for (var i = 0; i < oController._wfResults.length; i++) {
			// 	var item = oController._wfResults[i];

			// 	if (item.VwnmSid && !result[item.VwnmSid]) {
			// 		result[item.VwnmSid] = {
			// 			Vwnm: item.Vwnm,
			// 			VwnmId: item.VwnmId,
			// 			VwnmSid: item.VwnmSid,
			// 			Heading: item.Heading
			// 		};
			// 	}

			// 	if (item.MultipleId && !result[item.MultipleId]) {
			// 		result[item.MultipleId] = {
			// 			Vwnm: item.Vwnm,
			// 			VwnmId: item.VwnmId,
			// 			VwnmSid: item.VwnmSid,
			// 			Heading: item.FmmDes || item.Heading,
			// 			MultipleId: item.MultipleId
			// 		};
			// 	}
			// }

			// oController.SubViewList = result;
			// if (oController.vAppId !== "CX" && oController.vAppId !== "VX") {
			// 	if (!oController.vTransid) {
			// 		var aMultipleIds = Object.keys(oController.initialMultiplePayload);
			// 		var fnProcessMultipleSequential = function(index) {

			// 			if (index >= aMultipleIds.length) {
			// 				return; // all done
			// 			}
			// 			var vMultipleId = aMultipleIds[index];
			// 			oController.fnBuildDefaultMultipleFromMain(vMultipleId, function(oDefaultMulti) {
			// 				if (oDefaultMulti && oDefaultMulti.rows && oDefaultMulti.rows.length) {
			// 					var oFragModel = oController.getView().getModel("JM_" + vMultipleId);
			// 					if (oFragModel) {
			// 						var oFragData = oFragModel.getData();
			// 						oFragData.rows = oDefaultMulti.rows;
			// 						oFragModel.refresh(true);

			// 						oController._multipleValueCache =
			// 							oController._multipleValueCache || {};

			// 						oController._multipleValueCache[vMultipleId] =
			// 							JSON.parse(JSON.stringify(oFragData));
			// 						// if (vMultipleId === "ADDR") {
			// 						// 	// For Address OverView
			// 						// 	var sPrefix = oController.fn_resolveBpPrefix();
			// 						// 	if (sPrefix === "VM") {
			// 						// 		var oModel = oController.getView().getModel("JM_ID_VMGAOV1");
			// 						// 	} else {
			// 						// 		var oModel = oController.getView().getModel("JM_ID_CMGAOV1");
			// 						// 	}
			// 						// 	var aLabels = oModel.getProperty("/labels");
			// 						// 	var aRows = oModel.getProperty("/rows");

			// 						// 	if (!aRows || aRows.length === 0) {
			// 						// 		if (sPrefix === "VM") {
			// 						// 			oController.fnViewAddRow("ID_VMGAOV1");
			// 						// 		} else {
			// 						// 			oController.fnViewAddRow("ID_CMGAOV1");
			// 						// 		}
			// 						// 	}

			// 						// 	if (sPrefix === "VM") {
			// 						// 		oController.fnViewAddRow("ID_VMGAOV1");
			// 						// 		var AddressData = oDataResults.filter(function(item) {
			// 						// 			return item.VwnmId === "ID_VMGAD" && (item.Multiple === "X" || !item.MultipleId);
			// 						// 		});
			// 						// 	} else {
			// 						// 		oController.fnViewAddRow("ID_CMGAOV1");
			// 						// 		var AddressData = oDataResults.filter(function(item) {
			// 						// 			return item.VwnmId === "ID_CMGAD" && (item.Multiple === "X" || !item.MultipleId);
			// 						// 		});
			// 						// 	}

			// 						// 	var AddressOverViewData = oController.getView().getModel("JM_ADDR").getProperty("/labels");

			// 						// 	var aCombinedLabels = oController.fnBuildCombinedLabelArray(
			// 						// 		AddressData,
			// 						// 		AddressOverViewData
			// 						// 	);

			// 						// 	var oCombinedMap = {};
			// 						// 	aCombinedLabels.forEach(function(oItem) {
			// 						// 		oCombinedMap[oItem.cacheId] = oItem.tableId;
			// 						// 	});

			// 						// 	var oAddrModel = oController.getView().getModel("JM_ADDR");
			// 						// 	if (!oAddrModel) {
			// 						// 		return;
			// 						// 	}

			// 						// 	var oAddrData = oAddrModel.getData();
			// 						// 	if (!oAddrData || !oAddrData.rows || oAddrData.rows.length === 0) {
			// 						// 		return;
			// 						// 	}
			// 						// 	var oFieldModel = oController.getView().getModel("JM_FieldValue");
			// 						// 	if (!oFieldModel) {
			// 						// 		return;
			// 						// 	}

			// 						// 	var oFieldData = oFieldModel.getData();
			// 						// 	if (!oFieldData) {
			// 						// 		return;
			// 						// 	}

			// 						// 	var oMap = oCombinedMap;

			// 						// 	var oRow = oAddrData.rows[0];

			// 						// 	Object.keys(oMap).forEach(function(sSourceKey) {

			// 						// 		var sTargetKey = oMap[sSourceKey];

			// 						// 		if (
			// 						// 			oRow.hasOwnProperty(sTargetKey) &&
			// 						// 			oRow[sTargetKey] &&
			// 						// 			typeof oFieldData[sSourceKey] !== "undefined"
			// 						// 		) {
			// 						// 			oRow[sTargetKey].value = oRow[sTargetKey].value || oFieldData[sSourceKey] || "";
			// 						// 		}

			// 						// 	});

			// 						// 	oAddrModel.setProperty("/rows/0", oRow);

			// 						// 	oController._multipleValueCache["ADDR"] = oAddrModel.getData();

			// 						// }
			// 					}
			// 				}
			// 				fnProcessMultipleSequential(index + 1);
			// 			});
			// 		};
			// 		fnProcessMultipleSequential(0);
			// 	}
			// }
			// EOC

		},
		fnBuildMultiplePayload: function(aMeta, oValues) {

			var oPayload = {};

			aMeta.forEach(function(field) {

				// skip marker rows
				if (field.Multiple === "X") {
					return;
				}

				// only process fields having MultipleId
				if (!field.MultipleId) {
					return;
				}

				// init group if not exists
				if (!oPayload[field.MultipleId]) {
					oPayload[field.MultipleId] = [{
						fields: [],
						SubId: field.VwnmSid //Added by srikanth on 18.02-2026
					}];
				}

				// clone metadata
				var oFieldClone = Object.assign({}, field);

				// inject value
				if (oValues && Object.keys(oValues).length > 0) {
					oFieldClone.RuleValue = oValues[oFieldClone.FnmId] || "";
				}

				// push into group
				oPayload[field.MultipleId][0].fields.push(oFieldClone);
			});

			return oPayload;
		},

		fnCreatePannelHeader: function(Vwnm, VwnmId, oController) {
			var oPanelHeader = new sap.m.HBox({
				id: oController.createId(VwnmId + "_HEADER"),
				height: "2.5rem",
				justifyContent: "SpaceBetween",
				alignItems: "Center",
				items: [
					new sap.m.Label({
						text: Vwnm
					}).addStyleClass("sapUiSmallMarginBegin  cl_init_pannelTitleFont"),
					new sap.m.HBox({
						items: [
							new sap.m.ToggleButton({
								id: oController.createId(VwnmId + "_B"),
								icon: oController.getView().getModel("JM_ImageModel").getProperty("/path") + "ArrowUp.svg",
								pressed: "false"
							}).addStyleClass("cl_init_togglebutton").attachPress(oController.fnTogglePress, oController)
						]
					})
				]
			}).addStyleClass("cl_init_pannelHead");
			return oPanelHeader;
		},

		fnCreateGridContainer: function(VwnmId, oController) {
			var oContentContainer = new sap.ui.layout.Grid({
				id: oController.createId(VwnmId + "_GRID"),
				hSpacing: 0,
				visible: true,
				defaultSpan: "L12 M12 S12"
			}).addStyleClass("cl_init_grid");
			return oContentContainer;
		},

		fnCreateSubHeadding: function(Heading, oController, VwnmSid) {

			var aItems = [
				new sap.m.Text({
					text: Heading
				}).addStyleClass("sapUiTinyMarginBegin cl_init_subheadingFont")
			];

			if (VwnmSid === "ID_CMGADV5" || VwnmSid === "ID_VMGADV5" || VwnmSid === "ID_CMGADV7" || VwnmSid === "ID_VMGADV7") {
				aItems.push(

					new sap.m.Button({
						icon: oController.getView().getModel("JM_ImageModel").getProperty("/path") + "OtherCommunication.svg",
						text: "Other Communication",
						press: oController.fnOpen.bind(oController, VwnmSid)
					}).addStyleClass("cl_iconBtn cl_PrimaryButton")
				);
			}

			return new sap.m.HBox({
				height: "1.6rem",
				justifyContent: "SpaceBetween",
				alignItems: "Center",
				items: aItems,
				layoutData: new sap.ui.layout.GridData({
					span: "L12 M12 S12"
				})
			}).addStyleClass(
				"sapUiSmallMarginBegin sapUiTinyMarginBottom sapUiTinyMarginTop cl_kd_subheading"
			);
		},
		fnCreateInputLabel: function(FmmDes, require, FnmId, oController) {
			var oLabel = new sap.m.HBox({
				height: "24px",
				items: [
					new sap.m.Label({
						id: FnmId + "_TXT",
						text: FmmDes,
						tooltip: FmmDes,
						labelFor: FnmId
					}).addStyleClass("cl_init_inputLabel")
				],
				layoutData: new sap.ui.layout.GridData({
					span: "L3 M3 S12"
				})
			});
			return oLabel;
		},
		fnCreateF4InputField: function(
			widthcalculation,
			FnmId,
			Fnm,
			Fieldlength,
			require,
			Indicator,
			Display,
			format,
			oController,
			Changed,
			FieldSize,
			sModelName,
			RowCount
		) {
			sModelName = sModelName || "JM_FieldValue";
			var bIsNumeric;
			var fieldType;
			var bIsDecimal;

			if (Number(Indicator) !== 0) {
				bIsDecimal = true;
			} else if (format === "NUMC" || format === "INT2" || format === "INT1" || format === "QUAN" || format === "DEC") {
				bIsNumeric = true;
			} else {
				bIsNumeric = false;
				bIsDecimal = false;
			}

			if (bIsDecimal || bIsNumeric) {
				fieldType = true;
			} else {
				fieldType = false;
			}

			var editableFlag = (Display === "");

			if (!this._inputFieldMap) {
				this._inputFieldMap = {};
			}
			this._inputFieldMap[FnmId] = {
				length: Fieldlength,
				decimalPlaces: Number(Indicator),
				isNumeric: bIsNumeric,
				isDecimal: bIsDecimal
			};

			var oWidth = this.fnWidthForInputFields(Fieldlength, FieldSize);
			var widthMain = oWidth.MainInput;
			var widthDesc = oWidth.Desc;

			var oMainInput = new sap.m.Input({
				id: FnmId,
				required: require,
				value: {
					path: sModelName + ">/" + FnmId,
					mode: sap.ui.model.BindingMode.TwoWay
				},
				valueState: {
					path: sModelName + ">/" + FnmId + "_VS"
				},
				valueStateText: {
					path: sModelName + ">/" + FnmId + "_VST"
				},
				tooltip: {
					path: sModelName + ">/" + FnmId
				},
				type: fieldType ? sap.m.InputType.Number : sap.m.InputType.Text,
				showValueHelp: true,
				valueHelpRequest: function(oEvent) {
					oController.fnF4press(oEvent);
				},
				width: "100%",
				editable: editableFlag,
				maxLength: fieldType ? Fieldlength + 1 : Fieldlength,
				liveChange: oController.fnLiveChange.bind(oController)
			}).addStyleClass(
				"cl_init_inputField" +
				(Changed === "X" ? " cl_ChangeLogIndicator" : "")
			);
			var oMainVBox = new sap.m.VBox({
				width: widthMain,
				items: [oMainInput]
			}).addStyleClass("cl_init_marginEnd");

			if (sModelName !== "JM_FieldValue") {

				var oFieldDes = oController.getView().getModel("JM_FieldDes").getData();

				if (!oFieldDes[sModelName]) {
					oFieldDes[sModelName] = [];
				}

				if (!oFieldDes[sModelName][RowCount]) {
					oFieldDes[sModelName][RowCount] = {};
				}
				if (!oFieldDes[sModelName][RowCount][FnmId])
					oFieldDes[sModelName][RowCount][FnmId] = "";

				oController.getView().getModel("JM_FieldDes").refresh();

				var oDescInput = new sap.m.Input({
					id: FnmId + "_DES",
					editable: false,
					width: "100%",
					value: {
						path: "JM_FieldDes>/" + sModelName + "/" + RowCount + "/" + FnmId,
						mode: sap.ui.model.BindingMode.TwoWay
					},
					tooltip: {
						path: "JM_FieldDes>/" + FnmId
					}
				}).addStyleClass("cl_init_descField");
			} else {

				var oDescInput = new sap.m.Input({
					id: FnmId + "_DES",
					editable: false,
					width: "100%",
					value: {
						path: "JM_FieldDes>/" + FnmId,
						mode: sap.ui.model.BindingMode.TwoWay
					},
					tooltip: {
						path: "JM_FieldDes>/" + FnmId
					}
				}).addStyleClass("cl_init_descField");
			}

			var oDescVBox = new sap.m.VBox({
				width: widthDesc,
				items: [oDescInput]
			});

			var oFinalHBox = new sap.m.HBox({
				items: [oMainVBox, oDescVBox],
				layoutData: new sap.ui.layout.GridData({
					span: "L3 M3 S12"
				})
			});

			return oFinalHBox;
		},

		fnCreateInputField: function(
			FnmId,
			Fieldlength,
			require,
			Indicator,
			Display,
			format,
			oController,
			Changed,
			Multiple,
			MultipleId,
			sModelName
		) {
			sModelName = sModelName || "JM_FieldValue";
			var aNumericFormats = ["NUMC", "INT1", "INT2"];
			var aDecimalFormats = ["DEC", "QUAN"];

			var iDecimalPlaces = Number(Indicator) || 0;
			var bIsDecimal = iDecimalPlaces > 0 || aDecimalFormats.includes(format);
			var bIsNumeric = aNumericFormats.includes(format);
			var bIsNumber = bIsDecimal || bIsNumeric;

			var bEditable = !Display;

			this._inputFieldMap = this._inputFieldMap || {};
			this._inputFieldMap[FnmId] = {
				length: Fieldlength,
				decimalPlaces: iDecimalPlaces,
				isNumeric: bIsNumeric,
				isDecimal: bIsDecimal
			};
			var sInputClass;

			if (Changed === "X") {
				sInputClass = "cl_init_inputField";
				sInputClass += " cl_ChangeLogIndicator";
			}

			if (Multiple === "X" && MultipleId) {
				sInputClass += " cl_multipleInput";
			} else {
				sInputClass = "cl_init_inputField";
			}
			var oInput = new sap.m.Input({
				id: FnmId,
				width: "100%",
				maxLength: bIsDecimal ? Fieldlength + 1 : Fieldlength,
				type: bIsNumber ? sap.m.InputType.Number : sap.m.InputType.Text,
				value: {
					path: sModelName + ">/" + FnmId,
					mode: sap.ui.model.BindingMode.TwoWay
				},
				tooltip: {
					path: sModelName + ">/" + FnmId
				},
				valueState: {
					path: sModelName + ">/" + FnmId + "_VS"
				},

				valueStateText: {
					path: sModelName + ">/" + FnmId + "_VST"
				},
				required: require === true,
				editable: bEditable,
				liveChange: oController.fnLiveChange.bind(oController)
			}).addStyleClass(sInputClass);

			var oInputBox = new sap.m.VBox({
				width: "100%",
				items: [oInput]
			});

			var aItems = [oInputBox];

			if (Multiple === "X" && MultipleId) {

				var oImage = new sap.m.Image({
					src: oController.getView().getModel("JM_ImageModel")
						.getProperty("/path") + "MultiComm.svg",
					press: function(oEvent) {
						oController.fragmentMode = "FIELD_DETAILS";
						oController.activeMainFieldId = oController.fnNormalizeMainFieldId(FnmId);
						oController.selectedRowData = null;
						oController.selectedRowPath = null;
						oController.fnMaintainMultiple(MultipleId);
					}.bind(oController)
				}).addStyleClass("cl_imgFocus cl_multiplecomm sapUiSmallTinyTop");

				var sModelName = "JM_" + MultipleId;

				var oBadge = new sap.m.Text({
					text: {
						path: sModelName + ">/rows",
						formatter: function(aRows) {
							return aRows && aRows.length ? aRows.length : "";
						}
					},
					visible: {
						path: sModelName + ">/rows",
						formatter: function(aRows) {
							return aRows && aRows.length > 0;
						}
					}
				}).addStyleClass("cl_roundBadge");

				var oWrapper = new sap.m.HBox({
					items: [oImage, oBadge]
				}).addStyleClass("cl_imgWrapper");

				aItems.push(oWrapper);
			}

			return new sap.m.HBox({
				items: aItems,
				layoutData: new sap.ui.layout.GridData({
					span: "L3 M3 S12"
				})
			});

		},

		fnCreateCheckBoxfield: function(FnmId, Display, oController, Changed, Text, sModelName) {
			sModelName = sModelName || "JM_FieldValue";
			var oModel = oController.getView().getModel(sModelName);
			var editableFlag = (Display === "");

			if (oModel) {
				var value = oModel.getProperty("/" + FnmId);
				if (value === "") {
					oModel.setProperty("/" + FnmId, false);
				} else if (value === "X") {
					oModel.setProperty("/" + FnmId, true);
				}
			}

			return new sap.m.CheckBox({
				id: FnmId,
				text: "",
				selected: {
					path: sModelName + ">/" + FnmId,
					type: new sap.ui.model.type.Boolean(),
					mode: sap.ui.model.BindingMode.TwoWay
				},
				select: function(oEvent) {
					oController.fnCheckBoxLiveChange(oEvent, FnmId);
				},
				editable: editableFlag
			}).addStyleClass(
				"cl_checkbx" + (Changed === "X" ? " cl_ChangeLogCheckBox" : "")
			);
		},
		fnCreateErrorField: function(FnmId, oController) {
			var field = new sap.m.HBox({
				items: [
					new sap.m.Text({
						id: FnmId + "_ERR",
						text: "error field",
						visible: false
					}).addStyleClass("cl_errorTxt")
				],
				layoutData: new sap.ui.layout.GridData({
					span: "L3 M3 S12"
				})
			});
			return field;
		},
		fnWidthForInputFields: function(n, size) {
			var count = parseInt(n, 10) || 0;
			var s = size || "";

			if (s === "S") {
				if (count <= 3) {
					return 23;
				} else if (count === 9 || count === 10) {
					return 40;
				} else if (count === 4 || count === 5) {
					return 30;
				} else if (count === 6 || count === 7) {
					return 35;
				}
			} else if (s === "M") {
				if (count <= 15) {
					return 50;
				} else {
					return 60;
				}
			} else if (s === "L") {
				return 70;
			}
			if (count <= 3) {
				return 23;
			} else if (count === 9 || count === 10) {
				return 40;
			} else if (count === 4 || count === 5) {
				return 30;
			} else if (count === 6 || count === 7) {
				return 35;
			} else if (count <= 15) {
				return 50;
			} else {
				return 60;
			}
		},
		fnCreateTableSubheadding: function(Heading, oTable, oController) {
			var oSubHeading = new sap.m.HBox({
				height: "1.6rem",
				alignItems: "Center",
				justifyContent: "SpaceBetween",
				items: [
					new sap.m.Text({
						text: Heading
					}).addStyleClass("sapUiTinyMarginBegin cl_init_subheadingFont"),

					new sap.m.HBox({
						items: [
							new sap.m.Button({
								icon: oController.getView().getModel("JM_ImageModel").getProperty("/path") + "Plus.svg",
								press: function() {
									oController.fnViewAddRow(oTable);
								}
							}).addStyleClass("cl_init_tableAdd sapUiTinyMarginEnd"),
							new sap.m.Button({
								icon: oController.getView().getModel("JM_ImageModel").getProperty("/path") + "Delete.svg",
								press: function() {
									oController.fnViewRemoveSelectedRow(oTable);
								}
							}).addStyleClass("cl_init_tableDelete sapUiTinyMarginEnd")
						]
					})
				],
				layoutData: new sap.ui.layout.GridData({
					span: "L12 M12 S12"
				})
			}).addStyleClass("sapUiSmallMarginBegin sapUiTinyMarginBottom sapUiTinyMarginTop  cl_kd_subheading");

			return oSubHeading;
		},
		fnCreateTableSubActions: function(oTable, oController) {

			var oSubActions = new sap.m.HBox({
				height: "2rem",
				alignItems: "Center",
				justifyContent: "End",
				items: [
					new sap.m.HBox({
						items: [
							new sap.m.Button({
								icon: oController.getView().getModel("JM_ImageModel").getProperty("/path") + "Plus.svg",
								press: function() {
									oController.fnViewAddRow(oTable);
								}
							}).addStyleClass("cl_init_tableAdd sapUiTinyMarginEnd"),

							new sap.m.Button({
								icon: oController.getView().getModel("JM_ImageModel").getProperty("/path") + "Delete.svg",
								press: function() {
									oController.fnViewRemoveSelectedRow(oTable);
								}
							}).addStyleClass("cl_init_tableDelete sapUiTinyMarginEnd")
						]
					})
				],
				layoutData: new sap.ui.layout.GridData({
					span: "L12 M12 S12"
				})
			}).addStyleClass(
				"sapUiSmallMarginBegin sapUiTinyMarginBottom sapUiTinyMarginTop "
			);

			return oSubActions;
		},
		fnCreateFragmentSubActions: function(sMultipleId, oController) {

			var oSubActions = new sap.m.HBox({
				height: "2rem",
				alignItems: "Center",
				justifyContent: "End",
				items: [
					new sap.m.HBox({
						items: [
							new sap.m.Button({
								icon: oController.getView().getModel("JM_ImageModel").getProperty("/path") + "Plus.svg",
								press: function() {
									oController.fnX400AddPage(sMultipleId);
								}
							}).addStyleClass("cl_init_tableAdd sapUiTinyMarginEnd"),

							new sap.m.Button({
								icon: oController.getView().getModel("JM_ImageModel").getProperty("/path") + "Delete.svg",
								press: function() {
									oController.fnX400DeletePage(sMultipleId);
								}
							}).addStyleClass("cl_init_tableDelete sapUiTinyMarginEnd")
						]
					})
				],
				layoutData: new sap.ui.layout.GridData({
					span: "L12 M12 S12"
				})
			}).addStyleClass(
				"sapUiSmallMarginBegin sapUiTinyMarginBottom sapUiTinyMarginTop "
			);

			return oSubActions;
		},
		fnCreateDynamicTable: function(aRawData, tableid, oController) {
			var aColumns = [];
			var aInputs = [];

			for (var i = 0; i < aRawData.length; i++) {
				if (aRawData[i].type === "L") {
					aColumns.push(aRawData[i]);
				} else if (aRawData[i].type === "I" || aRawData[i].type === "C" || aRawData[i].type === "R") {
					aInputs.push(aRawData[i]);
				}
			}
			var uniqueInputs = [];
			var seenMap = {};

			for (var i = 0; i < aInputs.length; i++) {
				var item = aInputs[i];
				var key = item.cnt + "_" + item.id;

				if (!seenMap[key]) {
					seenMap[key] = true;
					uniqueInputs.push(item);
				}
			}
			for (var j = 0; j < Math.min(aColumns.length, uniqueInputs.length); j++) {
				var tempId = aColumns[j].id;
				aColumns[j].id = uniqueInputs[j].id;
				uniqueInputs[j].id = tempId;
				aColumns[j].valueHlp = uniqueInputs[j].valueHlp;
				aColumns[j].editable = uniqueInputs[j].editable;
				aColumns[j].type = uniqueInputs[j].type;
				aColumns[j].Dname = uniqueInputs[j].Dname;
				aColumns[j].SearchHelp = uniqueInputs[j].SearchHelp;
				aColumns[j].Multiple = uniqueInputs[j].Multiple;
				aColumns[j].MultipleId = uniqueInputs[j].MultipleId;
			}

			return this.fnCreateUITable(aColumns, aInputs, tableid, oController);
		},

		fnCreateUITable: function(aColumns, aInputs, tableid, oController) {

			var columnCount = aColumns.length;
			// var subid = aColumns[0].MultipleId;
			// if (!subid)
			// 	subid = aColumns[0].subid;
			var subid = aColumns[0].MultipleId || aColumns[0].subid;
			var viewId = aColumns[0].viewId;
			var modelName = "JM_" + subid;
			var bindingPath = modelName + ">/rows";

			oController.TableModelSet.push(modelName);

			var oView = oController.getView();
			var oExistingModel = oView.getModel(modelName);
			var bHasExistingData = !!(
				oExistingModel &&
				oExistingModel.getProperty("/rows") &&
				oExistingModel.getProperty("/rows").length > 0 &&
				oExistingModel.getProperty("/labels") &&
				oExistingModel.getProperty("/labels").length > 0
			);

			var oModelToUse;

			if (bHasExistingData) {
				oModelToUse = oExistingModel;
				oModelToUse.refresh(true);
			} else {
				var inputValue = this.fnGroupByTableRow(aInputs || []);
				var aFormattedRows = [];
				var tableRowKeys = Object.keys(inputValue);
				for (var k = 0; k < tableRowKeys.length; k++) {
					var rowKey = tableRowKeys[k];
					var aInputsForRow = inputValue[rowKey];
					var row = {};
					var isChanged = "";

					var hasData = false;
					aColumns.forEach(function(col) {
						var input = aInputsForRow.find(function(inp) {
							return inp.Fnm === col.Fnm;
						});
						if (input) {
							if (col.type === "R") {
								var val = input.RuleValue === "X" ? "X" : "";
								row[col.id] = {
									value: val,
									editable: input.editable !== false,
									valueHlp: input.valueHlp || false
								};
								if (val === "X") {

									hasData = true;
								}
							} else if (col.type === "C") {
								var val = input.RuleValue === "X" ? "X" : "";
								row[col.id] = {
									value: val,
									editable: input.editable !== false,
									valueHlp: input.valueHlp || false
								};
								if (val) {
									hasData = true;
								}
							} else {
								var val = (input.RuleValue || "").trim();
								row[col.id] = {
									value: val,
									editable: input.editable !== false,
									valueHlp: input.valueHlp || false
								};

								if (val) {
									hasData = true;
								}
							}

							row[col.id + "_VS"] = "None";
							row[col.id + "_VST"] = "";

							if (input.Changed === "X") {
								isChanged = "X";
							}

						} else {

							if (col.type === "R") {
								row[col.id] = {
									value: "",
									editable: false,
									valueHlp: false
								};
							} else {
								row[col.id] = {
									value: "",
									editable: false,
									valueHlp: false
								};
							}

							row[col.id + "_VS"] = "None";
							row[col.id + "_VST"] = "";
						}
					});
					row["Changed"] = isChanged;
					if (hasData) {
						aFormattedRows.push(row);
					}
				}

				// Create fresh model only for initial load
				var oJsonModel = new sap.ui.model.json.JSONModel({
					labels: aColumns,
					rows: aFormattedRows
				});
				oJsonModel.setDefaultBindingMode(sap.ui.model.BindingMode.TwoWay);

				oView.setModel(oJsonModel, modelName);
				oModelToUse = oJsonModel;
			}

			// ────────────────────────────────────────────────────────────────
			// Create the table UI control — always bind to the chosen model
			// ────────────────────────────────────────────────────────────────
			// var oTable = new sap.ui.table.Table({
			// 	id: subid,
			// 	visibleRowCount: 4,
			// 	rows: {
			// 		path: bindingPath
			// 	},
			// 	// rowSelectionChange: this.fnUITableRowSelectionChange.bind(this, modelName)
			// }).addStyleClass("cl_init_table cl_customRowCheckbox sapUiSmallMarginBegin");

			// ────────────────────────────────────────────────────────────────
			var oTable = new sap.ui.table.Table({
				id: subid,
				visibleRowCount: 4
			}).addStyleClass("cl_TableStyle  sapUiSmallMarginBegin");

			// Set model first
			oTable.setModel(oModelToUse, modelName);

			// Then bind rows explicitly
			oTable.bindRows({
				path: "/rows",
				model: modelName
			});

			// oTable.setNoData(
			// 	new sap.m.VBox({
			// 		alignItems: "Center",
			// 		justifyContent: "Center",
			// 		items: [
			// 			new sap.m.Image({
			// 				src: oController.getView().getModel("JM_ImageModel").getProperty("/path") + "NoDataFound1.svg",
			// 				width: "150px",
			// 				height: "150px"
			// 			}),
			// 			new sap.m.Text({
			// 				text: "No Data Found"
			// 			})
			// 		]
			// 	})
			// );

			oTable.setModel(oModelToUse, modelName);

			// ────────────────────────────────────────────────────────────────
			// Update JM_FieldValue model ONLY on initial creation
			// (prevents overwriting cached data on reopen)
			// ────────────────────────────────────────────────────────────────
			if (!bHasExistingData) {
				var oFieldValueModel = oView.getModel("JM_FieldValue");
				if (!oFieldValueModel) {
					oFieldValueModel = new sap.ui.model.json.JSONModel({});
					oView.setModel(oFieldValueModel, "JM_FieldValue");
				}

				var oFieldValueData = oFieldValueModel.getData() || {};
				oFieldValueData[subid] = oModelToUse.getData();
				oFieldValueModel.setData(oFieldValueData);
			}

			// ────────────────────────────────────────────────────────────────
			// Column templates (unchanged)
			// ────────────────────────────────────────────────────────────────
			aColumns.forEach(function(oCol) {
				var oTemplate;

				if (oCol.type === "I" && oCol.SearchHelp === "T") {
					oTemplate = new sap.m.VBox({
						width: "100%",
						items: [
							new sap.m.DatePicker({
								width: "100%",
								value: {

									path: modelName + ">" + oCol.id + "/value",
									type: new sap.ui.model.type.Date({
										source: {
											pattern: "yyyyMMdd"
										},
										pattern: "dd.MM.yyyy",
										strictParsing: true
									}),
									mode: sap.ui.model.BindingMode.TwoWay
								},
								editable: "{" + modelName + ">" + oCol.id + "/editable}",
								valueState: "{" + modelName + ">" + oCol.id + "_VS}",
								valueStateText: "{" + modelName + ">" + oCol.id + "_VST}",

								change: function(oEvent) {
									oController.fnDatepickerChange(oEvent, oCol.id, modelName, oCol.MultipleId);
								},
								displayFormat: "dd.MM.yyyy",
								valueFormat: "yyyyMMdd"
							}).addStyleClass("cl_init_tableInput")
						]
					});
				} else if (oCol.type === "I" && oCol.Multiple === "X" && oCol.MultipleId) {
					oTemplate = new sap.m.VBox({
						width: "100%",
						items: [
							new sap.m.HBox({
								width: "100%",
								alignItems: "Center",
								items: [
									new sap.m.Input({
										value: "{" + modelName + ">" + oCol.id + "/value}",
										tooltip: "{" + modelName + ">" + oCol.id + "/value}",
										editable: "{" + modelName + ">" + oCol.id + "/editable}",
										showValueHelp: "{" + modelName + ">" + oCol.id + "/valueHlp}",
										valueState: "{" + modelName + ">" + oCol.id + "_VS}",
										valueStateText: "{" + modelName + ">" + oCol.id + "_VST}",

										valueHelpRequest: function(oEvent) {
											oController.onValueHelp(oEvent);
										},

										liveChange: function(oEvent) {
											oController.fnTableLiveChange(oEvent);
										}
									}).addStyleClass("cl_init_tableInput"),
									new sap.m.Button({
										icon: oController.getView()
											.getModel("JM_ImageModel")
											.getProperty("/path") + "MultiComm.svg",
										type: "Transparent",
										tooltip: "Maintain " + oCol.MultipleId,
										press: function(oEvent) {

											var oCtx = oEvent.getSource().getBindingContext(modelName);
											if (!oCtx) {
												sap.m.MessageToast.show("Row context not found");
												return;
											}
											oController.selectedRowData = oCtx.getObject();
											oController.selectedRowPath = oCtx.getPath().split("/").pop();
											oController.fragmentMode = "ROW_DETAILS";
											oController.fnMaintainMultiple(oCol.MultipleId);
										}.bind(oController)
									}).addStyleClass("cl_multiplecommbtn cl_removeBlueBorder")
								]
							})
						]
					}).addStyleClass("cl_init_nonedit_bg");
				} else if (oCol.type === "I" && oCol.SearchHelp !== "T") {
					oTemplate = new sap.m.VBox({
						width: "100%",
						items: [
							new sap.m.Input({
								value: "{" + modelName + ">" + oCol.id + "/value}",
								tooltip: "{" + modelName + ">" + oCol.id + "/value}",
								editable: "{" + modelName + ">" + oCol.id + "/editable}",
								showValueHelp: "{" + modelName + ">" + oCol.id + "/valueHlp}",
								valueState: "{" + modelName + ">" + oCol.id + "_VS}",
								valueStateText: "{" + modelName + ">" + oCol.id + "_VST}",

								valueHelpRequest: function(oEvent) {
									oController.fnTableF4press(oEvent);
								},

								liveChange: function(oEvent) {
									oController.fnTableLiveChange(oEvent);
								}
							}).addStyleClass("cl_init_tableInput")
						]
					});

					// if (oCol.valueHlp) {
					// 	var oInput = sap.ui.getCore().byId(oCol.id);
					// 	if (oInput) {
					// 		// oInput.setValue(item2);
					// 		this.fnTableLiveChange({
					// 			getSource: function() {
					// 				return oInput;
					// 			}
					// 		});
					// 	}
					// }

				} else if (oCol.type === "R") {

					oTemplate = new sap.m.VBox({
						alignItems: "Start",
						items: [
							new sap.m.RadioButton({
								groupName: tableid + "_RADIO",

								selected: {
									path: modelName + ">" + oCol.id + "/value",
									formatter: function(v) {
										return v === "X";
									}
								},

								select: function(oEvent) {

									var bSelected = oEvent.getParameter("selected");
									var oGroup = oEvent.getSource();
									var oCtx = oGroup.getBindingContext(modelName);
									var oModel = oCtx.getModel();
									var sRowPath = oCtx.getPath();

									oModel.setProperty(sRowPath + "/" + oCol.id + "/value", bSelected ? "X" : "");
								}
							}).addStyleClass("cl_Radiobtns sapUiSizeCompact")
						]
					});
				} else if (oCol.type === "C") {
					oTemplate = new sap.m.VBox({
						width: "100%",
						alignItems: "Start",
						items: [
							new sap.m.CheckBox({
								selected: {
									path: modelName + ">" + oCol.id + "/value",
									formatter: function(v) {
										return v === "X";
									}
								},

								select: function(oEvent) {
									var bSelected = oEvent.getParameter("selected");
									var oCtx = oEvent.getSource().getBindingContext(modelName);
									var oModel = oCtx.getModel();
									var sRowPath = oCtx.getPath();
									oModel.setProperty(sRowPath + "/" + oCol.id + "/value", bSelected ? "X" : "");
									oController.fnCheckBoxLiveChange(oEvent, oCol.id, oCtx, oCol.MultipleId);
								},

								enabled: "{" + modelName + ">" + oCol.id + "/editable}"
							}).addStyleClass("cl_checkbx sapUiTinyMarginBegin")
						]
					});
				} else if (oCol.type === "I") {
					oTemplate = new sap.m.VBox({
						width: "100%",
						items: [
							new sap.m.Input({
								value: "{" + modelName + ">" + oCol.id + "/value}",
								tooltip: "{" + modelName + ">" + oCol.id + "/value}",
								editable: "{" + modelName + ">" + oCol.id + "/editable}",
								showValueHelp: "{" + modelName + ">" + oCol.id + "/valueHlp}",
								valueState: "{" + modelName + ">" + oCol.id + "_VS}",
								valueStateText: "{" + modelName + ">" + oCol.id + "_VST}",
								valueHelpRequest: function(oEvent) {
									oController.onValueHelp(oEvent);
								},
								liveChange: function(oEvent) {
									oController.fnTableLiveChange(oEvent);
								}
							}).addStyleClass("cl_init_tableInput")
						]
					}).addStyleClass("cl_init_nonedit_bg");
				}

				oTable.addColumn(new sap.ui.table.Column({
					id: oCol.id,
					label: new sap.m.Label({
						text: oCol.value,
						tooltip: oCol.value
					}),
					template: oTemplate
				}));
			});

			oTable.setRowSettingsTemplate(
				new sap.ui.table.RowSettings({
					highlight: {
						path: modelName + ">Changed",
						formatter: function(sChanged) {
							return sChanged === "X" ? sap.ui.core.IndicationColor.Indication01 : undefined;
						}
					}
				})
			);

			return oTable;
		},

		fnGroupByTableRow: function(aInputs) {

			var groupedInputs = {};

			aInputs.forEach(function(item) {

				if (item.type === "H") {
					return; // skip header type only
				}

				var row = item.tableRow;

				if (!groupedInputs[row]) {
					groupedInputs[row] = [];
				}

				groupedInputs[row].push(item);
			});

			return groupedInputs;
		},

		fnCreateDatePickerField: function(FnmId, Display, oController, Changed, sModelName) {
			sModelName = sModelName || "JM_FieldValue";
			var editableFlag = (Display === "");
			return new sap.m.HBox({
				items: [
					new sap.m.VBox({
						width: "100%",
						items: [
							new sap.m.DatePicker({
								id: FnmId,
								width: "100%",
								value: {
									path: sModelName + ">/" + FnmId,
									type: new sap.ui.model.type.Date({
										source: {
											pattern: "yyyyMMdd"
										},
										pattern: "dd.MM.yyyy",
										strictParsing: true
									}),
									mode: sap.ui.model.BindingMode.TwoWay
								},
								editable: editableFlag,
								change: function(oEvent) {
									oController.fnDatepickerChange(oEvent, FnmId);
								},
								displayFormat: "dd.MM.yyyy",
								valueFormat: "yyyyMMdd"
							}).addStyleClass("cl_init_dateField" + (Changed === "X" ? " cl_ChangeLogIndicator" : ""))
						]
					})
				],
				layoutData: new sap.ui.layout.GridData({
					span: "L3 M3 S12"
				})
			});
		},
		fnLoadRowFrgFields: function(aFields, oController, sModelName, RowCount) {

			sModelName = sModelName || "JM_FieldValue"; // default fallback

			var oRootVBox = new sap.m.VBox({}).addStyleClass(" sapUiSmallMarginBegin cl_fragmentbox");
			if (sModelName !== "JM_X400_ID" && sModelName !== "JM_X400_ID_IN") {
				oRootVBox.removeStyleClass("sapUiSmallMarginTop");
			}
			var oGrid = null;

			for (var i = 0; i < aFields.length; i++) {

				var oField = aFields[i];

				if (oField.TypFld === "H") {
					if (oGrid) {
						oRootVBox.addItem(oGrid);
						oGrid = null;
					}

					oRootVBox.addItem(
						this.fnCreatex400PannelHeader(
							oField.Heading,
							oController,
							oField.VwnmSid
						)
					);

					oGrid = new sap.ui.layout.Grid({
						defaultSpan: "L3 M3 S12"
					});
					continue;
				}

				if (!oGrid) {
					oGrid = new sap.ui.layout.Grid({
						defaultSpan: "L3 M3 S12"
					});
				}

				if (oField.TypFld === "C") {
					var aCheckBoxes = [];
					while (i < aFields.length && aFields[i].TypFld === "C") {
						aCheckBoxes.push(aFields[i]);
						i++;
					}
					i--;

					oGrid.addContent(
						this.fnbuildX400CheckboxRow(aCheckBoxes, oController, sModelName)
					);
					continue;
				}

				var bRequired = oField.Rqr === "X";
				var bValueHelp = oField.SearchHelp !== "";

				var oLabel = this.fnCreateInputLabel(
					oField.FmmDes,
					bRequired,
					oField.FnmId,
					oController
				);

				var oInput;

				if (oField.TypFld === "I" && oField.SearchHelp === "T") {

					// DATE PICKER
					oInput = this.fnCreateDatePickerField(
						oField.FnmId,
						oField.Dsply,
						oController,
						oField.Changed,
						sModelName
					);

				} else if (oField.TypFld === "I" && oField.SearchHelp !== "") {

					// F4 INPUT
					oInput = this.fnCreateF4InputField(
						this.fnWidthForInputFields(oField.FieldLength),
						oField.FnmId,
						oField.Fnm,
						Number(oField.FieldLength),
						bRequired,
						oField.FieldDec,
						oField.Dsply,
						oField.FieldFormat,
						oController,
						oField.Changed,
						null,
						sModelName,
						RowCount
					);

				} else {

					// NORMAL INPUT
					oInput = this.fnCreateInputField(
						oField.FnmId,
						Number(oField.FieldLength),
						bRequired,
						oField.FieldDec,
						oField.Dsply,
						oField.FieldFormat,
						oController,
						oField.Changed,
						oField.Multiple,
						oField.MultipleId,
						sModelName,
						RowCount
					);
				}

				var oError = this.fnCreateErrorField(oField.FnmId, oController);

				oGrid.addContent(
					new sap.m.VBox({
						items: [oLabel, oInput, oError]
					})
				);
			}

			if (oGrid) {
				oRootVBox.addItem(oGrid);
			}

			return oRootVBox;
		},
		fnbuildX400CheckboxRow: function(aFields, oController, sModelName) {

			var aItems = [];

			aFields.forEach(function(oField) {

				var oLabel = this.fnCreateInputLabel(
					oField.FmmDes,
					oField.Rqr === "X",
					oField.FnmId,
					oController
				);

				var oCheckbox = this.fnCreateCheckBoxfield(
					oField.FnmId,
					oField.Dsply,
					oController,
					oField.Changed,
					"", sModelName
				);

				var oError = this.fnCreateErrorField(oField.FnmId, oController);

				aItems.push(
					new sap.m.VBox({
						items: [oLabel, oCheckbox, oError],
						width: "25%"
					})
				);

			}.bind(this));

			return new sap.m.HBox({
				items: aItems,
				wrap: "Wrap"
			});
		},
		fnGroupByVwnmSid: function(aData) {
			var oMap = {};
			var aResult = [];

			aData.forEach(function(oItem) {
				var sKey = oItem.VwnmSid;

				if (!oMap[sKey]) {
					oMap[sKey] = {
						VwnmSid: oItem.VwnmSid,
						Heading: oItem.Heading,
						Vwnm: oItem.Vwnm,
						MultipleId: oItem.MultipleId,
						fields: []
					};
					aResult.push(oMap[sKey]);
				}

				oMap[sKey].fields.push(oItem);
			});

			return aResult;
		},
		fnCreatex400PannelHeader: function(Heading, oController, VwnmSid) {

			var aItems = [
				new sap.m.Text({
					text: Heading
				}).addStyleClass("sapUiTinyMarginBegin cl_init_subheadingFont")
			];

			return new sap.m.HBox({
				height: "1.6rem",
				justifyContent: "SpaceBetween",
				alignItems: "Center",
				items: aItems,
				layoutData: new sap.ui.layout.GridData({
					span: "L12 M12 S12"
				})
			}).addStyleClass(
				"sapUiSmallMarginBegin sapUiTinyMarginBottom sapUiTinyMarginTop cl_kd_subheading"
			);
		},
		fnCreatex400GridContainer: function(sVwnmSid, oController) {

			return new sap.ui.layout.Grid({
				id: oController.createId(sVwnmSid + "_GRID"),
				hSpacing: 0,
				visible: true,
				defaultSpan: "L12 M12 S12"
			}).addStyleClass("cl_init_grid");
		},
		fnBindComments: function(vBackendData, oController, vContainer) {
			for (var c = 0; c < vBackendData.length; c++) {
				var Pos1 = (vBackendData[c].Pos === "") ? true : false;
				var Pos2 = (vBackendData[c].Pos === "Last") ? true : false;
				var oDotVBox = new sap.m.VBox({
					alignContent: "Start",
					alignItems: "Center",
					justifyContent: "Start",
					items: [
						new sap.m.Image({
							src: oController.getView().getModel("JM_ImageModel").getProperty("/path") + "CommentDot.svg",

							width: "0.4rem"
						}),
						new sap.m.HBox({
							visible: Pos1
						}),
						new sap.m.HBox({
							visible: Pos2
						})
					]
				}).addStyleClass("sapUiTinyMarginBegin");
				var oRightVBox = new sap.m.VBox({
					items: [
						new sap.m.HBox({
							items: [
								new sap.m.Image({
									src: oController.getView().getModel("JM_ImageModel").getProperty("/path") + "profile.svg",

									width: "1.5rem"
								}).addStyleClass("sapUiTinyMarginBeginEnd"),
								new sap.m.Text({
									text: vBackendData[c].CreatedBy
								}).addStyleClass("cl_comm_nam"),
								new sap.m.Text({
									text: "Added A Comment"
								}).addStyleClass("sapUiTinyMarginBeginEnd cl_comm_subtx"),
								new sap.m.Image({
									src: oController.getView().getModel("JM_ImageModel").getProperty("/path") + "Dot.svg",

									width: "0.4rem"
								}),
								new sap.m.Text({
									text: vBackendData[c].CrtdDate + " - " + vBackendData[c].CrtdTime
								}).addStyleClass("sapUiTinyMarginBeginEnd cl_comm_date")
							]
						}),
						new sap.m.Panel({
							// width: "10%",
							content: [
								new sap.m.Text({
									text: vBackendData[c].Comments,
									wrapping: true,
									width: "100%"
								}).addStyleClass("cl_cmt_txt")
							]
						}).addStyleClass("cl_cmmt_bx sapUiSmallMarginBottom")
					]
				});

				// Combine left and right side into HBox
				var oCommentCard = new sap.m.HBox({
					width: "98%",
					items: [oDotVBox, oRightVBox]
				}).addStyleClass("cl_commt_hbx sapUiSmallMarginTop");

				// Add to container
				vContainer.addItem(oCommentCard);
			}
		},
		fnBindAttachments: function(oData, oController) {
			var vAttachmentDataArray = [];
			for (var b = 0; b < oData.NavReadAttachments.results.length; b++) {
				var serial = Number(oData.NavReadAttachments.results[b].SerialNo);
				var vObj = {
					"AttachmentNo": serial,
					"TagName": oData.NavReadAttachments.results[b].FileName,
					"DocType": oData.NavReadAttachments.results[b].FileName.split('.')[1],
					"Xstring": oData.NavReadAttachments.results[b].Xstring,
					"MimeType": oData.NavReadAttachments.results[b].MimeType,
					"Size": oData.NavReadAttachments.results[b].FileSize,
					"CreatedOn": oData.NavReadAttachments.results[b].CreatedOn,
					"CreatedBy": oData.NavReadAttachments.results[b].CreatedBy
				};
				vAttachmentDataArray.push(vObj);
			}

			// var oJsonList2 = new sap.ui.model.json.JSONModel();
			var oJsonList2 = new sap.ui.model.json.JSONModel({
				List: vAttachmentDataArray
			});

			oController.attachments = oData.NavReadAttachments.results;
			oController.getView().setModel(oJsonList2, "JM_DocTypeModel");

		},

		// fnUITableRowSelectionChange: function(modelName, oEvent) {
		// 	var oTable = oEvent.getSource();
		// 	var iRowIndex = oEvent.getParameter("rowIndex");

		// 	if (iRowIndex < 0) {
		// 		return;
		// 	}

		// 	var oCtx = oTable.getContextByIndex(iRowIndex);
		// 	if (!oCtx) {
		// 		return;
		// 	}

		// 	var oRowData = oCtx.getObject();

		// 	var oModel = oCtx.getModel();
		// 	var aLabels = oModel.getProperty("/labels") || [];
		// 	var viewId = aLabels[0] && aLabels[0].viewId;

		// 	if (viewId !== "ID_VMGAT") {
		// 		return;
		// 	}

		// 	var sTextType = oRowData.ID_VMGATV1_I6.value;
		// 	var sLanguage = oRowData.ID_VMGATV1_I7.value;

		// 	var bEnableRemarks = !!(sTextType && sLanguage);

		// 	var oRemarks = sap.ui.getCore().byId("ID_VMGAT_REMARKS");
		// 	if (oRemarks) {
		// 		oRemarks.setEditable(bEnableRemarks);
		// 	}
		// },
	};
});