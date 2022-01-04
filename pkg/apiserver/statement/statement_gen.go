// Copyright 2022 PingCAP, Inc. Licensed under Apache-2.0.

package statement

import (
	"fmt"
	"strings"

	"github.com/thoas/go-funk"

	"github.com/pingcap/tidb-dashboard/pkg/apiserver/utils"
	"github.com/pingcap/tidb-dashboard/util/distro"
)

var ErrUnknownColumn = ErrNS.NewType("unknown_column")

func (s *Service) genSelectStmt(tableColumns []string, reqJSONColumns []string) (string, error) {
	fields := getFieldsAndTags()

	// use required fields filter when not all fields are requested
	if reqJSONColumns[0] != "*" {
		// "schema_name", "digest" for group, "sum_latency" for order
		requiredFields := funk.UniqString(append(reqJSONColumns, "schema_name", "digest", "sum_latency"))
		fields = funk.Filter(fields, func(f Field) bool {
			return funk.Contains(requiredFields, f.JSONName)
		}).([]Field)
	}

	// We have both TiDB 4.x and TiDB 5.x columns listed in the model. Filter out columns that do not exist in current version TiDB schema.
	fields = funk.Filter(fields, func(f Field) bool {
		var representedColumns []string
		if len(f.Related) != 0 {
			representedColumns = f.Related
		} else {
			representedColumns = []string{f.JSONName}
		}

		return utils.IsSubsets(tableColumns, representedColumns)
	}).([]Field)

	if len(fields) == 0 {
		return "", ErrUnknownColumn.New("all columns are not included in the current version %s schema, columns: %q", distro.R().TiDB, reqJSONColumns)
	}

	stmt := funk.Map(fields, func(f Field) string {
		if f.Aggregation == "" {
			return f.JSONName
		}
		return fmt.Sprintf("%s AS %s", f.Aggregation, f.ColumnName)
	}).([]string)
	return strings.Join(stmt, ", "), nil
}
