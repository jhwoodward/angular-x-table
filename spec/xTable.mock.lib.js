/* jshint -W117, -W030 */
mockData.xtable = (function () {

    var data = [
        { id: 1, name: 'John', type:'Parent', age: 10, town: 'Hull', country:'England'},
        { id: 2, name: 'Jim', type:'Parent', age: 20, town: 'Glasgow', country:'Scotland'},
        { id: 3, name: 'Jane', type:'Parent', age: 30, town: 'Dublin', country:'Ireland'}
    ];

    var children = {
        1: [
            {id: 4, name: 'Alice', type: 'Child', age: 1, country: 'England'},
            {id: 5, name: 'Joan', type: 'Child', age: 3, country: 'England'}
        ],
        2: [
            {id: 6, name: 'George', type: 'Child', age: 4, country: 'Scotland'},
            {id: 7, name: 'Alex', type: 'Child', age: 6, country: 'Scotland'},
            {id: 8, name: 'Mark', type: 'Child', age: 2, country: 'Scotland'}
        ],
        3: [
            {id: 9, name: 'Edward', type: 'Child',  age: 5, country: 'Ireland'},
            {id: 10, name: 'Johann', type: 'Child', age: 9, country: 'Ireland'},
            {id: 11, name: 'Rita', type: 'Child', age: 8, country: 'Ireland'}
        ]
    };

    var actionsHtml = '<actions>' +
        '<action><a ng-click="stm.actionOneClicked()">action 1</a></action>' +
        '<action><a ng-click="stm.actionTwoClicked()">action 2</a></action>' +
        '<action allow="stm.allowActionThree"><a ng-click="stm.actionThreeClicked()">action 3</a></action>' +
        '</actions>';

    var actionsCloneArchiveDeleteHtml = '<actions>' +
        '<action><a ng-click="stm.actionOneClicked()">action 1</a></action>' +
        '<action clone="stm.clone"></action>' +
        '<action archive="stm.archive"></action>' +
        '<action delete="stm.delete"></action>' +
        '</actions>';

    var actionsExpandableHtml =  '<actions>' +
        '<action><a ng-click="stm.actionClicked()">action</a></action>' +
        '<action parent><a ng-click="stm.parentActionOneClicked()">parent action one</a></action>' +
        '<action parent><a ng-click="stm.parentActionTwoClicked()">parent action two</a></action>' +
        '<action child><a ng-click="stm.childActionClicked()">child action</a></action>' +
        '</actions>';

    var columnsHtml = '<column field="name" align="left"><header>Name</header>' +
        '<template><span ng-bind="row.name"></span></template></column>' +
        '<column field="age" align="right"><header>Age</header><template>{{row.age}}</template></column>' +
        '<column field="country" align="center"><header>Country</header><template>{{row.country}}</template></column>';

    var editableHtml = '<column field="name" align="left"><header>Name</header>' +
        '<template><span class="editable">{{row.name}}</span></template></column>' +
        '<column field="age" align="right"><header>Age</header><template>{{row.age}}</template></column>' +
        '<column field="country" align="center"><header>Country</header><template>{{row.country}}</template></column>';

    var columnsParentChildHtml = '<column field="name"><header>Name</header>' +
        '<template parent><div class="parentTemplate"><h1>{{row.name}}</h1></div></template>' +
        '<template child><div class="childTemplate">{{row.name}}</div></template>' +
        '</column>' +
        '<column field="age"><header>Age</header><template>{{row.age}}</template></column>' +
        '<column field="country"><header>Country</header><template>{{row.country}}</template></column>';

    var columnsBindHeaderHtml = '<column field="name"><header><button class="nameButton" ng-click="stm.onNameHeaderClick()">' +
        'Name</button></header><template><span ng-bind="row.name"></span></template></column>' +
        '<column field="age"><header>Age</header><template>{{row.age}}</template></column>' +
        '<column field="country"><header>Country</header><template>{{row.country}}</template></column>';

    var columnPermissionsHtml = '<column hidden="stm.hideColumnOne"><header>Name</header>' +
        '<template>{{row.name}}</template></column>' +
        '<column hidden="stm.hideColumnTwo"><header>Age</header><template>{{row.age}}</template></column>' +
        '<column hidden="stm.hideColumnThree"><header>Country</header><template>{{row.country}}</template></column>';

    var columnsSortableHtml = '<column field="name" headerclick="stm.onHeaderClicked"><header>Name</header><template>' +
        '<span ng-bind="row.name"></span></template></column>' +
        '<column headerclick="stm.onHeaderClicked" field="age"><header>Age</header><template>{{row.age}}</template></column>' +
        '<column headerclick="stm.onHeaderClicked" field="country"><header>Country</header>' +
        '<template>{{row.country}}</template></column>';

    var toolbarHtml = '<toolbar>this is the toolbar!</toolbar>';

    var html = {
        basic: '<stable-table data="data" stm="vm" on-row-click="vm.onRowClick(row)">' +
            columnsHtml +
            '</stable-table>',
        bindHeader: '<stable-table bind-header="true" data="data" stm="vm">' +
            columnsBindHeaderHtml +
            '</stable-table>',
        stickyHeader: '<stable-table data="data" stm="vm" sticky-header="true" sticky-offset="70">' +
            columnsHtml +
            '</stable-table>',
        rowWarning: '<stable-table data="data" stm="vm" ' +
            'row-warning="row.town===\'Hull\'" row-warning-message="row.town + \' is hell\'">' +
            columnsHtml +
            '</stable-table>',
        state: '<stable-table data="data" stm="vm" loaded="vm.loaded" filtered="vm.filtered">' +
            columnsHtml +
            '</stable-table>',
        sortableColumns: '<stable-table data="data" stm="vm" loaded="vm.loaded" ' +
            ' sort-key="vm.sortKey" sort-direction="vm.sortDirection">' +
            columnsSortableHtml +
            '</stable-table>',
        columnPermissions: '<stable-table stm="vm" data="data">' +
            columnPermissionsHtml +
            '</stable-table>',
        selectable: '<stable-table stm="vm" data="data" selectable="true" ' +
            ' on-selection-change="vm.onSelectionChange(selectedRows)" ' +
            ' on-row-select="vm.onRowSelect(event, row)"> ' +
            toolbarHtml +
            columnsHtml +
            '</stable-table>',
        selectableBindHeader: '<stable-table stm="vm" data="data" selectable="true" ' +
            ' bind-header="true" >' +
            columnsBindHeaderHtml +
            '</stable-table>',
        customActions: '<stable-table stm="vm" data="data">' +
            actionsHtml +
            columnsHtml +
            '</stable-table>',
        actionsCloneArchiveDelete: '<stable-table stm="vm" data="data" selectable="true" ' +
           ' on-selection-change="vm.onSelectionChange(selectedRows)" >' +
            actionsCloneArchiveDeleteHtml +
            columnsHtml +
            '</stable-table>',
        customActionsPermissions: '<stable-table data="data" stm="vm">' +
            actionsHtml +
            columnsHtml +
            '</stable-table>',
        selectableWithActions: '<stable-table data="data" stm="vm" selectable="true">' +
            actionsHtml +
            columnsHtml +
            '</stable-table>',
        editable: '<stable-table data="data" stm="vm" on-row-click="vm.onRowClick(row)"' +
            ' get-children="vm.getChildren(id)" on-child-click="vm.onChildClick(row)"' +
            ' on-parent-click="vm.onParentClick(row)">' +
            editableHtml +
            '</stable-table>',
        expandable: '<stable-table data="data" stm="vm" selectable="true" ' +
            ' on-selection-change="vm.onSelectionChange(selectedRows)" ' +
            ' get-children="vm.getChildren(id)" on-child-click="vm.onChildClick(row)"' +
            ' on-parent-click="vm.onParentClick(row)">' +
            actionsExpandableHtml +
            columnsHtml +
            '</stable-table>',
        expandableCache: '<stable-table data="data" stm="vm" ' +
            ' get-children="vm.getChildren(id)" cache-children="vm.cacheChildren" >' +
            columnsHtml +
            '</stable-table>',
        expandableParentChildTemplates: '<stable-table data="data" stm="vm"  ' +
            ' get-children="vm.getChildren(id)" >' +
            columnsParentChildHtml +
            '</stable-table>',
        expandableWithCloneArchiveDelete: '<stable-table data="data" selectable="true" stm="vm" ' +
            ' get-children="vm.getChildren(id)" >' +
            actionsCloneArchiveDeleteHtml +
            columnsHtml +
            '</stable-table>',
    };

    var getService =  function ($q) {
        return {
            getChildren: function(key) {
                var deferred = $q.defer();
                deferred.resolve(angular.copy(children[key]));
                return deferred.promise;
            }
        };
    };

    return {
        data: data,
        children: children,
        html: html,
        getService: getService
    };
}());
