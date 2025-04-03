<%@taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c" %>
<%@ taglib uri="http://java.sun.com/jsp/jstl/functions" prefix="fn" %>
<!doctype html>
<html>
<head>
    <meta charset="utf-8">
    <meta content="width=device-width, initial-scale=1, shrink-to-fit=no">
    <meta http-equiv="Cache-Control" content="no-store, no-cache, must-revalidate">
    <meta http-equiv="Pragma" content="no-cache">
    <meta http-equiv="Expires" content="-1">
    <link rel="stylesheet" href="css/bootstrap-4.5.2.min.css">
    <link rel="stylesheet" href="css/bootstrap.css">
    <link rel="stylesheet" href="css/loader.css">
    <link rel="stylesheet" href="css/planBCTLVRuleV2.css">
    <link rel="stylesheet" href="css/selectize.bootstrap3.css"/>
    <link rel="stylesheet" type="text/css" href="css/all-6.0.0.min.css">
    <link rel="icon" href="assets/PlanBuilderFavIcon.png">
    <script src="js/external/jquery-3.3.1.min.js"></script>
    <script src="js/external/bootstrap-popup.min.js"></script>
    <script src="js/external/bootstrap.js"></script>
    <script src="js/app/loader.js"></script>
    <link rel="stylesheet" href="css/JQueryBuilder.css">
    <script src="js/app/JQueryBuilderBctlvV2.js"></script>
    <script src="js/app/planBCTLVRuleV2.js"></script>
    <script src="js/external/selectize.js"></script>
    <script type="text/javascript" src="js/app/bctlvCloneModal.js"></script>
    <script src="js/external/popper-1.14.3.min.js"></script>
    <link rel="stylesheet" type="text/css" href="css/fixedColumns-4.3.0.dataTables.min.css"/>
    <link rel="stylesheet" type="text/css" href="css/datatables-1.10.21.min.css"/>
    <script type="text/javascript" src="js/external/datatables-1.10.21.min.js"></script>
    <link rel="stylesheet" type="text/css" href="css/query-builder-2.5.2.default.css">
    <script type="text/javascript" src="js/external/interact-1.6.2.js"></script>
    <script type="text/javascript" src="js/external/queryBuilder-2.5.2.standalone.js"></script>
    <script type="text/javascript" src="js/external/datatables-4.3.0.fixedColumns.min.js"></script>
    <link rel="stylesheet" href="css/font-awesome-4.4.0.min.css">
    <script src="js/external/jquery-ui-1.13.2.js"></script>
    <style>
        .modal:nth-of-type(even) {
            z-index: 1052 !important;
        }

        .modal-backdrop.show:nth-of-type(even) {
            z-index: 1051 !important;
        }

        .hide {
            display: none !important;
        }

        .attributeStripExample {
            position: relative;
            display: inline-block;
        }

        .attributeStripExample .attributeStripExampleText {
            visibility: hidden;
            width: 300px;
            background-color: white;
            color: black;
            text-align: center;
            border-radius: 6px;
            padding: 5px 0;
            /* Position the tooltip */
            position: absolute;
            z-index: 1;
        }

        .attributeStripExample:hover .attributeStripExampleText {
            visibility: visible;
        }
    </style>
    <script>
        $(function () {
            <%--var sourceBctlvData = '${planBCTLVRuleV2}';--%>
            <%--console.log(sourceBctlvData);--%>

            let isBenefitCatEmpty = "${isBenefitCatEmpty}";
            if (isBenefitCatEmpty == "true") {
                $("#displayPopup").modal('show');
            }
        });
    </script>
</head>
<title>BCTLV V2</title>
<body>
<div id="main">
    <%@include file="header.jsp" %>
    <%@include file="loader.jsp" %>
    <div>
        <div class="text-primary" style="margin: 2em;">
            <h1>${productBase.cocName} ${productBase.orgName}
                ${productBase.stateName} ${productBase.segName}
                ${productBase.prodName} ${productBase.stdName} - Rule Management</h1>
            <c:if test="${!isReadOnly }">
                <a class="btn btn-primary" role="button"
                   style="float: right; margin-top: -3em;"
                   onclick="releaseLock(event, false)" href="./ruleManagement">Check
                    In</a>
            </c:if>
        </div>
        <input type="hidden" name="roleId" id="roleId" value="${pageContext.session.getAttribute('roleId')}"/>
        <input type="hidden" id="planBCTLRuleV2IND" value="${planBCTLRuleV2IND}"/>
        <input type="hidden" id="cBBProductBaseID" value="${cBBProductBaseID}"/>
        <input type="hidden" id="columnId" value="${columnId}"/>
        <input type="hidden" id="benefitCategory" value="${benefitCategory}"/>
        <input type="hidden" id="paymentLine" value="${paymentLine}"/>
        <input type="hidden" id="tier" value="${tier}"/>
        <input type="hidden" id="costShareOverrides" value="${costShareOverrides}"/>
        <input type="hidden" id="productBaseId" value="${productBase.productBaseId}"/>
        <input type="hidden" id="cocName" value="${productBase.cocName}"/>
        <input type="hidden" id="orgName" value="${productBase.orgName}"/>
        <input type="hidden" id="stateName" value="${productBase.stateName}"/>
        <input type="hidden" id="segName" value="${productBase.segName}"/>
        <input type="hidden" id="prodName" value="${productBase.prodName}"/>
        <input type="hidden" id="stdName" value="${productBase.stdName}"/>
        <input type="hidden" id="checkOutById" value="${productBase.checkOutById}"/>
        <input type="hidden" id="checkOutByName" value="${productbase.checkOutByName}"/>
        <input type="hidden" id="isReadOnly" value="${isReadOnly}"/>
        <input type="hidden" id="isCopyEnabled" value="${isCopyEnabled}"/>
        <input type="hidden" id="isPasteEnabled" value="${isPasteEnabled}"/>
        <input type="hidden" id="copiedRules" value="${copiedRules}"/>
        <input type="hidden" id="benefitCodeToggle" value="${pageContext.session.getAttribute('benefitCodesToggle')}"/>

        <div class="shadow-lg p-3 mb-5 bg-white rounded" style="background-color: #dddddd; margin: 2em;">
            <div id="bctlvBtnContainer" class="row">
                <c:if test="${!isReadOnly }">
                    <div class="col-1 planActionButton">
                        <div class="d-grid gap-2">
                            <button type="button" class="btn btn-block btn-outline-primary planActionButton"
                                ${pageContext.session.getAttribute('roleId')==7?"disabled":""}
                                    onclick="saveBctlvV2Rules()">Save
                            </button>
                        </div>
                    </div>
                    <div class="col-1 planActionButton">
                        <div class="d-grid gap-2">
                            <button type="button" class="btn btn-block btn-outline-success planActionButton"
                                    onclick="exportPlanBCTLVRuleV2()">Export
                            </button>
                        </div>
                    </div>
                    <div class="col-1 planActionButton">
                        <div class="d-grid gap-2">
                            <button type="button" class="btn btn-outline-primary btn-block planActionButton"
                                ${pageContext.session.getAttribute('roleId')==7?"disabled":""}
                                    data-toggle="modal" data-target="#cloneModal"
                                    data-tab="header">Clone To
                            </button>
                        </div>
                    </div>
                </c:if>
                <div class="col-1 planActionButton">
                    <div class="d-grid gap-2">
                        <button type="button" class="btn btn-outline-secondary planActionButton"
                                onclick="clearSession();">Back
                        </button>
                    </div>
                </div>
                <c:if test="${(pageContext.session.getAttribute('tierValidationToggle') eq 'true')}">
                    <div id="rowCountBox" class="col-1 ms-auto">
                        <div class="d-flex justify-content-end">
                            <div id="yellowIcon" class="d-flex justify-content-end" title="Plan tier(s) needs be added to the BCTLV.">
                            </div>
                            <div id="redIcon" class="d-flex justify-content-end" title="Plan tier should be removed from the BCTLV.">
                            </div>
                            <div id="greenIcon" class="d-flex justify-content-end">
                            </div>
                        </div>
                    </div>
                </c:if>
                <c:if test="${(pageContext.session.getAttribute('benefitCodesToggle') eq 'true')}">
                    <div id="bcErrorCount" class="col-1 ms-auto">
                        <div class="d-flex justify-content-end">
                            <c:if test="${bcErrorYellowCount > 0}">
                                <i class="fas fa-exclamation-triangle me-1 mt-2 benefitCodeErrorYellow" title="Benefit code should be added to the BCTLV."></i>
                                <span class="fw-bold fs-5 ml-1 bcErrorCount">${bcErrorYellowCount}</span>
                            </c:if>
                            <c:if test="${bcErrorRedCount > 0}">
                                <i class="fas fa-exclamation-circle me-1 ml-3 benefitCodeErrorRed" title="Benefit code should be removed from the BCTLV."></i>
                                <span class="fw-bold fs-5 bcErrorCount">${bcErrorRedCount}</span>
                            </c:if>
                        </div>
                    </div>
                </c:if>
            </div>
            <div class="d-flex" style="padding-top: 10px" id="validateBtn">
                <c:if test="${pageContext.session.getAttribute('benefitCodesToggle') eq 'true' && !isReadOnly}">
                    <button type="button" class="btn btn-outline-primary me-4" id="validateBenefitCodeBtn"
                        ${pageContext.session.getAttribute('roleId')==7?"disabled":""} data-toggle="modal"
                        data-target="#validateBenefitCodesModal">Validate Benefit Codes
                    </button>
                </c:if>
                <c:if test="${(pageContext.session.getAttribute('tierValidationToggle') eq 'true')}">
                    <c:if test="${!hasBenefitCode && (!isReadOnly)}">
                        <button type="button" class="btn btn-outline-primary" id="validateTiersBtn"
                            ${pageContext.session.getAttribute('roleId')==7?"disabled":""} data-toggle="modal"
                            data-target="#validateTiersModal" data-tab="header">Validate Tiers
                        </button>
                    </c:if>
                </c:if>
            </div>
            <div class="row mt-3">
                <div class="table-responsive hide-scroll">
                    <c:if test="${!isReadOnly }">
                        <div id="contextMenu" class="dropdown-menu" style="display:none;">
                            <a class="dropdown-item" href="#" onclick="addRecord()">Add Record</a>
                            <a class="dropdown-item" href="#" onclick="cloneRecord()">Clone Record</a>
                            <a class="dropdown-item" href="#" onclick="deleteRecord()">Delete Record</a>
                            <a class="dropdown-item" href="#" onclick="duplicateRecord()">Duplicate Record</a>
                            <a class="dropdown-item" href="#" onclick="pasteRecord()">Paste Child Rule(s)</a>
                        </div>
                    </c:if>
                    <div class="row hide-scroll">
                        <div class="col-12 text-center">
                        <div id="bctlvSpinner" class="spinner-border text-secondary">
                        </div>
                            <span class="sr-only">Loading...</span>
                        </div>
                    </div>
                    <div id="bctlvContainer">
                        <table id="pocBctlvTable">
                            <thead>
                            <tr>
                                <th data-sortable="false"><input id="selectAllCheckbox" type="checkbox" style="width: 50px"/></th>
                                <c:if test="${pageContext.session.getAttribute('benefitCodesToggle') eq 'true' }">
                                    <th class="fixed-column4">Status</th>
                                </c:if>
                                <th class="scrollable column-color fixed-column1">BenefitCategory</th>
                                <th class="fixed-column2">PaymentLine</th>
                                <th class="fixed-column3">BenefitTier</th>
                                <th class="fixed-column3">CostShareOverrides</th>
                                <th class="fixed-column4">Category</th>
                                <th class="fixed-column4">BenefitCode</th>
                                <th class="fixed-column4">ReferencePlaceOfService</th>
                                <th class="fixed-column4">PlanTier</th>
                                <th class="fixed-column4">Level</th>
                                <th class="fixed-column4">Version</th>
                                <th class="fixed-column4">NetworkName</th>
                                <th class="fixed-column4">ProviderDesignation</th>
                                <th class="fixed-column4">QualityTierValue</th>
                                <th class="fixed-column4">EffectiveDate</th>
                                <th class="fixed-column4">ExpirationDate</th>
                                <th class="fixed-column4">MaxCopaymentsDT</th>
                                <th class="fixed-column4">MaxCopaymentsQty</th>
                                <th class="fixed-column4">MaxCopayments</th>
                                <th class="fixed-column4">State</th>
                                <th class="fixed-column4">DollarRangeType</th>
                                <th class="fixed-column4">DollarRangeForEveryDuration</th>
                                <th class="fixed-column4">DollarRangeForEvery</th>
                                <th class="fixed-column4">DollarRangeThru</th>
                                <th class="fixed-column4">DollarRangeFrom</th>
                                <th class="fixed-column4">OccurrenceForEveryDuration</th>
                                <th class="fixed-column4">OccurrenceForEvery</th>
                                <th class="fixed-column4">OccurrenceThru</th>
                                <th class="fixed-column4">OccurrenceFrom</th>
                                <th class="fixed-column4">RelationshipLimit</th>
                                <th class="fixed-column4">AgeLimitThru</th>
                                <th class="fixed-column4">AgeLimitFromDurationType</th>
                                <th class="fixed-column4">AgeLimitThruDurationType</th>
                                <th class="fixed-column4">AgeLimitFrom</th>
                                <th class="fixed-column4">PlaceOfService</th>
                                <th class="fixed-column4">BillTypeSetCategory</th>
                                <th class="fixed-column4">AssignedBenefitCodes</th>
                                <th class="fixed-column4">CoverageConditionType</th>
                                <th class="fixed-column4">MemberIndicator</th>
                                <th class="fixed-column4">ServiceAreaType</th>
                                <th class="fixed-column4">BenefitIsNotCoveredByBCTLVDRC</th>
                                <th class="fixed-column4">ElevatedBenefit</th>
                                <th class="fixed-column4">ServiceTypeCode</th>
                                <th class="fixed-column4">RelationshipCode</th>
                                <th class="fixed-column4">CostShareAccum</th>
                            </tr>
                            </thead>
                            <tbody id="pocBctlvTableBody">
                            </tbody>
                        </table>
                    </div>
                </div>

                <div class="modal" id="multiRuleModal">
                    <div class="modal-dialog modal-lg" style="min-width:90%;">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title" id="childRuleModalLabel1">BCTLV V2 Rule Editor - <span
                                        id="columnName"></span></h5>
                                <button type="button" class="close" data-dismiss="modal" aria-hidden="true">×</button>
                            </div>
                            <div class="modal-body">
                                <div class="row">
                                    <div class="col-6"></div>
                                    <div class="col-2">
                                        <button type="button" class="btn btn-outline-primary btn-block"
                                                onclick="collapseShow()">Expand All
                                        </button>
                                    </div>
                                    <div class="col-2">
                                        <button type="button" class="btn btn-outline-primary btn-block"
                                                onclick="collapseHide()">Collapse All
                                        </button>
                                    </div>
                                    <c:if test="${!isReadOnly }">
                                        <div class="col-2">
                                            <button type="button" class="btn btn-outline-success btn-block"
                                                ${pageContext.session.getAttribute('roleId')==7?"disabled":""}
                                                    data-toggle="modal" data-target="#childRuleModal">Add Rule
                                            </button>
                                        </div>
                                    </c:if>
                                </div>
                                <div class="row">
                                    <table class="table table-sm table-striped table-hoverable"
                                           style="margin-top: 1em" id="childRules">
                                    </table>
                                </div>
                            </div>
                            <div class="modal-footer" style="min-width:90%;">
                                <div class="col-1">
                                    <button type="button"
                                            class="btn btn-outline-primary btn-block planActionButtons"
                                            data-dismiss="modal" style="margin-right: 10px"
                                            onclick="enableBackGround()"><i
                                            class="fa fa-long-arrow-left"></i>Back
                                    </button>
                                </div>
                                <div class="col-1">
                                    <button type="button" class="btn btn-outline-primary btn-block planActionButtons"
                                            style="margin-right: 10px"
                                    ${pageContext.session.getAttribute('roleId')==7?"disabled":""}
                                            data-toggle="modal" data-target="#testLogicModal">Test Logic
                                    </button>
                                </div>
                                <c:if test="${!isReadOnly }">
                                    <div class="col-1">
                                        <button id="copyRuleId" type="button"
                                                class="btn btn-outline-primary btn-block planActionButtons"
                                                style="margin-right: 10px"
                                            ${pageContext.session.getAttribute('roleId')==7?"disabled":""}
                                                onclick="copyChildRules()">Copy
                                        </button>
                                    </div>
                                    <div class="col-1">
                                        <button id="pasteRuleId" type="button"
                                                class="btn btn-outline-success btn-block planActionButtons"
                                                style="margin-right: 10px"
                                            ${pageContext.session.getAttribute('roleId')==7?"disabled":""}
                                                onclick="pasteChildRules()">Paste
                                        </button>
                                    </div>
                                    <c:if test="${hasDeleteAccess}">
                                        <div class="col-1" style="width: 11% !important">
                                            <button type="button"
                                                    class="btn btn-outline-danger btn-block planActionButtons"
                                                    style="margin-right: 10px"
                                                ${pageContext.session.getAttribute('roleId')==7?"disabled":""}
                                                    data-toggle="modal" data-target="#deleteAllChildRulesModal">Delete All
                                            </button>
                                        </div>
                                    </c:if>

                                    <div class="col-1">
                                        <button type="button"
                                                class="btn btn-outline-success btn-block planActionButtons"
                                                style="margin-right: 10px"
                                            ${pageContext.session.getAttribute('roleId')==7?"disabled":""}
                                                onclick="saveRuleLogicDetail(0)" data-dismiss="modal">Save
                                        </button>
                                    </div>
                                </c:if>
                                <div class="col-1">
                                    <button type="button" class="btn btn-outline-primary btn-block planActionButtons"
                                            style="margin-right: 10px"
                                            id="historyBtn" data-toggle="modal"
                                            data-target="#planBCTLVRuleV2HistoryModal"
                                    ${pageContext.session.getAttribute('roleId')==7?"disabled":""}
                                            onclick="loadPlanBCTLVRuleV2History()">History
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal fade" id="deleteAllChildRulesModal" tabindex="-1"
                     role="dialog">
                    <div class="modal-dialog modal-dialog-centered" role="document">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title text-danger">Warning</h5>
                                <button type="button" class="close" data-dismiss="modal">&times;</button>
                            </div>
                            <div class="modal-body">
                                <p>Are you sure you want to delete all child rules?</p>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-outline-warning"
                                        data-dismiss="modal">No - Cancel
                                </button>
                                <button type="button" class="btn btn-outline-danger"
                                    id="childRuleDeleteConfirm" data-dismiss="modal"
                                    name="delete-all-childrules-btn">Yes
                                     - Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal fade" id="childRuleModal">
                    <div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
                        <div class="modal-content">
                            <div class="modal-header">
                                <c:if test="${roleId eq 1 or roleId eq 2 or roleId eq 3 or roleId eq 4 or roleId eq 11}">
                                    <h5 class="modal-title" id="childRuleModalLabel">Add Rule</h5>
                                    <button type="button" class="close" data-dismiss="modal" aria-hidden="true">×
                                    </button>
                                </c:if>
                            </div>
                            <div class="modal-body">
                                <form method="POST" action="<c:out value="${pageContext.request.requestURI}"/>">

                                    <div class="form-row" style="padding-top: 2em">
                                        <label for="whenQueryBuilder">When</label>
                                        <div class="container">
                                            <main role="main">
                                                <div id="whenQueryBuilder" class="whenQueryBuilder"></div>
                                            </main>
                                        </div>
                                    </div>
                                    <div class="form-row" style="padding-top: 2em">
                                        <label for="thenQueryBuilder">Then</label>
                                        <div class="container">
                                            <main role="main">
                                                <div id="thenQueryBuilder" class="thenQueryBuilder"></div>
                                            </main>
                                        </div>
                                    </div>
                                    <div class="form-row" style="padding-top: 1em">
                                        <div class="col-8"></div>
                                        <div class="col-2">
                                            <button type="button" class="btn btn-outline-warning btn-block"
                                            ${pageContext.session.getAttribute('roleId')==7?"disabled":""}
                                                    data-dismiss="modal">Cancel
                                            </button>
                                        </div>
                                        <div class="col-2">
                                            <button type="button" class="btn btn-outline-success btn-block"
                                            ${pageContext.session.getAttribute('roleId')==7?"disabled":""}
                                                    id="child-rule-save" onclick="saveBctlvChildRule(0)">Save to Draft
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal fade" id="planBCTLVRuleV2HistoryModal">
                    <div
                            class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">BCTLV V2 Detail History</h5>
                                <button type="button" class="close" data-dismiss="modal">&times;</button>
                            </div>
                            <div class="modal-body">

                                <form method="POST" action="<c:out value="${pageContext.request.requestURI}"/>">
                                    <table class="table table-sm table-striped table-hoverable"
                                           style="margin-top: 1em">
                                        <thead>
                                        <tr>
                                            <th scope="col">ID</th>
                                            <th scope="col">Created By</th>
                                            <th scope="col">Created Date</th>
                                        </tr>
                                        </thead>
                                        <tbody id="planBCTLVRuleV2HistoryBody">
                                        </tbody>
                                    </table>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal fade" id="testLogicModal">
                    <div
                            class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
                        <div class="modal-content">
                            <div class="modal-header">

                                    <h5 class="modal-title" id="childRuleModalLabel">Test Logic</h5>
                                <button type="button" class="close" data-dismiss="modal">&times;</button>
                            </div>
                            <div class="modal-body">
                                <div class="form-row">
                                    <select name="planType" id="planType" class="form-select">
                                        <option id="select" value="none" selected disabled>Select Plan Type</option>
                                        <option id="standardPlan" value="standardPlan">Standard</option>
                                        <option id="customPlan" value="customPlan">Custom</option>
                                    </select>
                                </div>
                                <div class="form-row" style="padding-top: 1em">
                                    <label for="planCode">Plan Codes</label>
                                    <input class="form-control" list="medicalPlansList" name="planCode" id="planCode">
                                    <datalist id="medicalPlansList"></datalist>

                                </div>
                                <div class="form-row" style="padding-top: 4em">
                                    <div class="col-4"></div>
                                    <div class="col-4">
                                        <button type="button" class="btn btn-outline-warning btn-block"
                                                data-dismiss="modal">Cancel
                                        </button>
                                    </div>
                                    <div class="col-4">
                                        <button type="button" class="btn btn-outline-primary btn-block"
                                                id="testLogicExecute" name="execute-test-logic-btn">Execute
                                        </button>
                                    </div>

                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal fade" id="validateBenefitCodesModal">
                    <div
                            class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title" id="validateBenefitCodesLabel">Validate Benefit Codes</h5>
                                <button type="button" class="close" data-dismiss="modal">&times;</button>
                            </div>
                            <div class="modal-body">
                                <div class="form-row">
                                    <select name="vbcPlanType" id="vbcPlanType" class="form-select">
                                        <option id="select" value="none" selected disabled>Select Plan Type</option>
                                        <option id="standardPlan" value="standardPlan">Standard</option>
                                        <option id="customPlan" value="customPlan">Custom</option>
                                    </select>
                                </div>
                                <div class="form-row padding-1em">
                                    <label for="planCode">Plan Codes</label>
                                    <input class="form-control" list="medicalPlansList" name="vbcPlanCode" id="vbcPlanCode">
                                    <datalist id="medicalPlansList"></datalist>

                                </div>
                                <div class="form-row padding-1em" id="serviceCompSetDiv">
                                    <input type="hidden" id="serviceCompSetIDInput" value="${fn:escapeXml(ServiceCompSetID)}">
                                </div>
                                <div class="form-row padding-4em" >
                                    <div class="col-2" id="blankSpace"></div>
                                    <div class="col-4">
                                        <button type="button" class="btn btn-outline-warning btn-block"
                                                data-dismiss="modal" id="cancel-button">Cancel
                                        </button>
                                    </div>
                                    <div class="col-6">
                                        <button type="button" class="btn btn-outline-primary btn-block"
                                                id="validate-benefit-codes" name="validate-benefit-codes-btn">Retrieve ServCompSetID
                                        </button>
                                    </div>

                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal fade" id="validateTiersModal">
                    <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title" id="childRuleModalLabel">Validate Tiers</h5>
                                <button type="button" class="close" data-dismiss="modal">&times;</button>
                            </div>
                            <div class="modal-body">
                                <div class="form-row">
                                    <select name="vncPlanType" id="vncPlanType" class="form-select">
                                        <option id="select" value="none" selected disabled>Select Plan Type</option>
                                        <option id="standardPlan" value="standardPlan">Standard</option>
                                        <option id="customPlan" value="customPlan">Custom</option>
                                    </select>
                                </div>
                                <div class="form-row" style="padding-top: 1em">
                                    <label for="planCode">Plan Codes</label>
                                    <input class="form-control" list="medicalPlansList" name="vncPlanCode" id="vncPlanCode">
                                    <datalist id="medicalPlansList"></datalist>
                                </div>
                                <div class="form-row" style="padding-top: 4em">
                                    <div class="col-4"></div>
                                    <div class="col-4">
                                        <button type="button" class="btn btn-outline-warning btn-block" data-dismiss="modal">Cancel
                                        </button>
                                    </div>
                                    <div class="col-4">
                                        <button type="button" class="btn btn-outline-primary btn-block"
                                        id="validate-Tier" name="validate-Tier-btn">Validate Tiers
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal fade" id="cloneModal">
                    <%@include file="cloneModal.jsp"%>
                </div>
            </div>
            <template id="replace_text_template">
                <div class="must_equal">
                    <input type="text" style="width: 283px;" class="planDetails-then"
                           placeholder="select Plan Detail"/> <input
                        class="form-control input-sm replace-from" style="width: 283px;"
                        type="text" min="0"/> to <input
                        class="form-control input-sm replace-to" style="width: 283px;"
                        type="text" min="0"/>
                </div>
            </template>
            <template id="attribute_value_template">
                <div class="must_equal">
                    <input type="text" style="width: 283px" class="form-control planDetails-then"
                           placeholder="select Plan Detail"/>&nbsp;
                    <input type="text" style="width: 283px" class="form-control attributes-dropdown"
                           placeholder="Customize"/>&nbsp;
                    <div class="attributeStripExample">
                        <input id="splitValue" class="form-control" type="text" style="width: 150px;visibility: hidden;"
                               placeholder="eg: left,right"/>
                        <span class="attributeStripExampleText">
			HiosID: 69842LA0240013-01 <br>
			Input : 5,0  -> Output : 69842 <br>
			Input : 0,6  -> Output : 013-01
		</span>
                    </div>
                </div>
            </template>
            <template id="element_template">
                <div class="is_equal_to" id="element_template_div">
                    <select name="applicationName" id="elementNameSel" class="form-control"></select> &nbsp;&nbsp;
                    value (if applicable) &nbsp;<input id="elementText" class="form-control" style="width: 200px;"
                                                       type="text"/>
                </div>
            </template>
            <div id="successCustom" style="position: fixed; bottom: 1%; right: 50%; z-index: 1055;" class="toast" aria-atomic="true" role="alert" data-autohide="false">
                <div class="toast-header">
                    <strong class="mr-auto text-primary">
                        <i class="fas fa-square" style="color: #00a550"></i> Test Successful
                    </strong>
                    <button type="button" class="ml-2 mb-1 close" data-dismiss="toast" onclick="closeOutput()">&times;
                    </button>
                </div>
                <div class="toast-body" style="background-color: #E8E8E8"
                     id="successCustomMessage"></div>
            </div>
            <jsp:include page="SideNav.jsp"/>
        </div>
    </div>
    <div class="modal fade" id="displayPopup" aria-hidden="true">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="Warningmodal">Warning!</h5>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close" onclick="closeModal()">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <div class="modal-body">
                    <p>Please remediate missing Benefit Category, Payment Line, Tier before you continue</p>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-primary" onclick="closeModal()">Close</button>
                </div>
            </div>
        </div>
    </div>

    <!-- validateStateErrorModal -->
    <div class="modal fade" id="validateStateErrorModal" tabindex="-1" role="dialog" aria-hidden="true"
         aria-labelledby="validateStateErrorModal">
        <div class="modal-dialog modal-dialog-centered" role="document">
            <div class="modal-content">
                <div class="modal-header">
                    <h5><span class="modal-title text-danger">Error</span></h5>
                    <button type="button" value="Close" class="btn-close" data-bs-dismiss="modal" aria-label="Close"/>
                </div>
                <div class="modal-body" id="validateStateErrorMessage">State specific configurations do not allow
                    cloning from one state to another.
                </div>
                <div class="modal-footer">
                    <button type="button" value="OK" class="btn btn-outline-danger" data-bs-dismiss="modal"
                            autocomplete="off">OK
                    </button>
                </div>
            </div>
        </div>
    </div>
</div>
<%@include file="footer.html" %>

</body>
</html>

