(function() {
    'use strict';

    angular
        .module('xtable')
        .controller('controller', controller);

    /* @ngInject */
    function controller($scope, $timeout, $q, _) {
        /* jshint validthis: true */
        var st = this;
        var api = {
            selectedRows: [],
            selectedParents: [],
            selectedChildren: [],
            allSelected: false,
            toggleSelectAll: toggleSelectAll,
            setSelectedRows: setSelectedRows
        };
        var defaults = {
            emptyText: 'No data',
            filteredEmptyText: 'No results matching your query',
            iconChild: 'fa fa-mail-reply',
            iconParent: 'fa fa-plus',
            iconParentExpanded: 'fa fa-minus',
            iconLoading: 'fa fa-spinner fa-spin fa-2x',
            iconProcessing: 'fa fa-circle-o-notch fa-spin',
            className: 'table-hover table-responsive',
            selectable: false,
            expandable: false,
            childClickable: false,
            parentClickable: false,
            rowClickable: false,
            stickyHeader: false,
            cacheChildren: false,
            sortKey: null,
            sortDirection: null
        };

        activate();

        function activate() {
            st.data = st.data || [];
            st.state = 'loading';
            angular.extend(st, api);
            setDefaults();
            watchState();
        }

        function watchState() {
            $scope.$watch('st.loaded', setState);
            $scope.$watch('st.filtered', setState);
            $scope.$watch('st.data.length', setState);
        }

        function setState() {
            st.state = getState();
        }

        function getState() {
            if (st.loaded) {
                if (st.data && st.data.length) {
                    return 'data';
                }
                if (!st.data || !st.data.length && !st.filtered) {
                    return 'empty';
                }
                if (!st.data || !st.data.length && st.filtered) {
                    return 'noresults';
                }
            }
            return 'loading';
        }

        function setDefaults() {
            var key;
            for (key in defaults) {
                st[key] = st[key] || defaults[key];
            }
        }

        function toggleSelectAll () {
            _.forEach(st.data, function(row) {
                row.st._props.selected = st.allSelected;
            });
            st.selectedParents = st.allSelected ? st.data : [];
            toggleChildren();
            setSelectedRows();

            function toggleChildren() {
                _.each(st.data, function(parent) {
                    var children = parent.st._props.children;
                    if (children) {
                        _.each(children, function(child) {
                            child.st._props.selected = st.allSelected;
                        });
                    }
                });
            }
        }

        function raiseSelectionChanged() {
            if (st.onSelectionChange) {
                var selection = {
                    selectedRows: st.selectedRows,
                    selectedParents: st.selectedParents,
                    selectedChildren: st.selectedChildren
                };
                st.onSelectionChange(selection);
            }
        }

        function setSelectedRows() {
            st.selectedParents = st.data.filter(filterSelected);
            var selectedChildren = [];
            _.each(st.data, function(parent) {
                if (parent.st._props.expanded) {
                    selectedChildren = selectedChildren.concat(parent.st._props.children.filter(filterSelected));
                }
            });
            st.selectedChildren = selectedChildren;
            st.selectedRows = st.selectedParents.concat(st.selectedChildren);
            raiseSelectionChanged();

            function filterSelected(row) {
                return row.st._props.selected;
            }
        }

    }
})();
