/**
 * Copyright 2018 The Lovefield Project Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {ExecType} from '../../base/private_enum';
import {Journal} from '../../cache/journal';
import {Context} from '../../query/context';
import {Table} from '../../schema/table';
import {Relation} from '../relation';
import {PhysicalQueryPlanNode} from './physical_query_plan_node';

export class DeleteStep extends PhysicalQueryPlanNode {
  private table: Table;

  constructor(table: Table) {
    super(1, ExecType.FIRST_CHILD);
    this.table = table;
  }

  public toString(): string {
    return `delete(${this.table.getName()})`;
  }

  public execInternal(
      relations: Relation[], journal?: Journal, context?: Context): Relation[] {
    const rows = relations[0].entries.map((entry) => entry.row);
    (journal as Journal).remove(this.table, rows);
    return [Relation.createEmpty()];
  }
}
