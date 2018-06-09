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

import {Database} from '../schema/database';
import {Index} from '../schema/index';
import {BTree} from './btree';
import {ComparatorFactory} from './comparator_factory';
import {IndexStore} from './index_store';
import {NullableIndex} from './nullable_index';
import {RowId} from './row_id';
import {RuntimeIndex} from './runtime_index';

// In-memory index store that builds all indices at the time of init.
export class MemoryIndexStore implements IndexStore {
  private store: Map<string, RuntimeIndex>;
  private tableIndices: Map<string, RuntimeIndex[]>;

  constructor() {
    this.store = new Map<string, RuntimeIndex>();
    this.tableIndices = new Map<string, RuntimeIndex[]>();
  }

  public init(schema: Database): Promise<void> {
    const tables = schema.tables();

    tables.forEach((table) => {
      const tableIndices: RuntimeIndex[] = [];
      this.tableIndices.set(table.getName(), tableIndices);

      const rowIdIndexName = table.getRowIdIndexName();
      const rowIdIndex: RuntimeIndex|null = this.get(rowIdIndexName);
      if (rowIdIndex === null) {
        const index = new RowId(rowIdIndexName);
        tableIndices.push(index);
        this.store.set(rowIdIndexName, index);
      }
      table.getIndices().forEach((indexSchema) => {
        const index = this.createIndex(indexSchema);
        tableIndices.push(index);
        this.store.set(indexSchema.getNormalizedName(), index);
      }, this);
    }, this);
    return Promise.resolve();
  }

  public get(name: string): RuntimeIndex|null {
    return this.store.get(name) || null;
  }

  public set(tableName: string, index: RuntimeIndex): void {
    let tableIndices = this.tableIndices.get(tableName) || null;
    if (tableIndices === null) {
      tableIndices = [];
      this.tableIndices.set(tableName, tableIndices);
    }

    // Replace the index in-place in the array if such index already exists.
    let existsAt = -1;
    for (let i = 0; i < tableIndices.length; i++) {
      if (tableIndices[i].getName() === index.getName()) {
        existsAt = i;
        break;
      }
    }

    if (existsAt >= 0 && tableIndices.length > 0) {
      tableIndices.splice(existsAt, 1, index);
    } else {
      tableIndices.push(index);
    }

    this.store.set(index.getName(), index);
  }

  public getTableIndices(tableName: string): RuntimeIndex[] {
    return this.tableIndices.get(tableName) || [];
  }

  private createIndex(indexSchema: Index): RuntimeIndex {
    const comparator = ComparatorFactory.create(indexSchema);
    const index = new BTree(
        indexSchema.getNormalizedName(), comparator, indexSchema.isUnique);

    return (indexSchema.hasNullableColumn() &&
            indexSchema.columns.length === 1) ?
        new NullableIndex(index) :
        index;
  }
}