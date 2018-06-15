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

import {TaskPriority, TransactionType} from '../lib/base/enum';
import {Resolver} from '../lib/base/resolver';
import {UniqueId} from '../lib/base/unique_id';
import {Relation} from '../lib/proc/relation';
import {Task} from '../lib/proc/task';
import {Table} from '../lib/schema/table';

export class MockTask extends UniqueId implements Task {
  public name: string;
  private txType: TransactionType;
  private scope: Set<Table>;
  private execFn: () => any;
  private priority: TaskPriority;
  private resolver: Resolver<Relation[]>;

  constructor(
      txType: TransactionType, scope: Set<Table>, execFn: () => any,
      priority: TaskPriority, name?: string) {
    super();
    this.txType = txType;
    this.scope = scope;
    this.execFn = execFn;
    this.priority = priority;
    this.resolver = new Resolver<Relation[]>();
    this.name = name || this.getUniqueId();
  }

  public getType(): TransactionType {
    return this.txType;
  }

  public getScope(): Set<Table> {
    return this.scope;
  }

  public getResolver(): Resolver<Relation[]> {
    return this.resolver;
  }

  public getId(): number {
    return super.getUniqueNumber();
  }

  public getPriority(): TaskPriority {
    return this.priority;
  }

  public exec(): Promise<Relation[]> {
    return new Promise<Relation[]>((resolve, reject) => {
      return resolve(this.execFn());
    });
  }
}
