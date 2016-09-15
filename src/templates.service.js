(function() {

    angular.module('xtable').factory('templates', templates);

    /* ngInject */
    function templates(_) {
        return {
            actions: {
                clone: _.template('<a class="st-clone" uib-tooltip="Duplicate"' +
                    'ng-click="clone($event, \'<%=fn%>\')" tooltip-append-to-body="true">' +
                    '<span class="fa fa-clone"></span></a>'),
                delete: _.template('<a class="st-delete" uib-tooltip="Delete"' +
                    'ng-click="delete($event, \'<%=fn%>\', $index)" tooltip-append-to-body="true">' +
                    '<span class="fa fa-trash"></span></a>'),
                archive: _.template('<a class="st-archive" uib-tooltip="Archive" ' +
                    'ng-click="archive($event, \'<%=fn%>\', $index)" tooltip-append-to-body="true">' +
                    '<span class="fa fa-inbox"></span></a>')
            },
            table: _.template('<table class="s-table table <%=className%> <%=type%>"></table>'),
            header: {
                checkbox: '<input type="checkbox" id="check-all" ng-model="st.allSelected " ' +
                    ' ng-change="st.toggleSelectAll()">',
                tplclick: _.template('<span ng-click="doHeaderClick(key, \'<%=fn%>\')" class="sort-icon" ' +
                    'ng-class=\'{ ' +
                    ' "sort-active": st.sortKey === key,' +
                    ' "sort-DESC" : st.sortDirection === \"DESC\" && st.sortKey === key, ' +
                    ' "sort-ASC" : st.sortDirection === \"ASC\" && st.sortKey === key}\'>' +
                    '<%=field%>' +
                    '<i class="fa fa-sort-down" aria-hidden="true"></i>' +
                    '<i class="fa fa-sort-up" aria-hidden="true"></i>' +
                    '<i class="fa fa-sort" aria-hidden="true"></i>' +
                    '</span>')
            },
            row: {
                template: '<tr ng-click="click($event, $index)" data-row-id="{{row.id}}" class="enter" ' +
                    'ng-class=\'{ ' +
                    ' "child-row": props.parent,' +
                    ' "parent-row" : !props.parent,' +
                    ' "first-child": props.firstChild,' +
                    ' "last-child": props.lastChild,' +
                    ' "expanded": props.expanded,' +
                    ' "warning": props.warning,' +
                    ' "loading": props.loading,' +
                    ' "highlight": props.highlight,' +
                    ' "processing": props.processing,' +
                    ' "clickable": props.clickable' +
                    '}\'></tr>',
                checkbox: '<input type="checkbox" id="check-{{row.id}}" ' +
                    'ng-model="props.selected" ng-change="select($event)">',
                expandableIcon: _.template('<i aria-hidden="true" ' +
                    'ng-class=\'{' +
                    '"<%=child%>": props.parent && !props.processing, ' +
                    '"<%=processing%>": props.processing, ' +
                    '"<%=parent%>": props.expandable  && !props.loading && !props.processing, ' +
                    '"<%=parentExpanded%>": !props.parent && props.expanded && !props.loading && !props.processing,' +
                    '"<%=loading%>": props.loading  && !props.processing}\'></i>'),
                warningIcon: '<i ng-if="props.warning" uib-tooltip="{{props.warningMessage}}" tooltip-placement="right"' +
                    ' tooltip-append-to-body="true" class="notification fa fa-exclamation-circle"></i>'
            },
            toolbar: '<div class="st-toolbar container-fluid" ' +
                    ' ng-show="st.selectedRows.length"></div>'
        };
    }

})();
