/**
 * Copyright 2016 The Lovefield Project Authors. All Rights Reserved.
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

export enum ConstraintAction {
  RESTRICT = 0,
  CASCADE = 1,
}

export enum ConstraintTiming {
  IMMEDIATE = 0,
  DEFERRABLE = 1,
}

export enum DataStoreType {
  INDEXED_DB = 0,
  MEMORY = 1,
  LOCAL_STORAGE = 2,
  FIREBASE = 3,
  WEB_SQL = 4,
  OBSERVABLE_STORE = 5,
}

export enum Order {
  DESC = 0,
  ASC = 1,
}

export enum Type {
  ARRAY_BUFFER = 0,
  BOOLEAN = 1,
  DATE_TIME = 2,
  INTEGER = 3,
  NUMBER = 4,
  STRING = 5,
  OBJECT = 6,
}

export const DEFAULT_VALUES: Map<Type, any> = new Map([
  [Type.ARRAY_BUFFER, null as any],              // nullable
  [Type.BOOLEAN, false],                         // not nullable
  [Type.DATE_TIME, Object.freeze(new Date(0))],  // not nullable
  [Type.INTEGER, 0],                             // not nullable
  [Type.NUMBER, 0],                              // not nullable
  [Type.STRING, ''],                             // not nullable
  [Type.OBJECT, null],                           // nullable
]);

export enum TransactionType {
  READ_ONLY = 0,
  READ_WRITE = 1,
}

export enum TableType {
  DATA = 0,
  INDEX = 1,
}

export enum ExecType {
  NO_CHILD = -1,    // Will not call any of its children's exec().
  ALL = 0,          // Will invoke all children nodes' exec().
  FIRST_CHILD = 1,  // Will invoke only the first child's exec().
}

export enum LockType {
  EXCLUSIVE = 0,
  RESERVED_READ_ONLY = 1,
  RESERVED_READ_WRITE = 2,
  SHARED = 3,
}

// The priority of each type of task. Lower number means higher priority.
export enum TaskPriority {
  EXPORT_TASK = 0,
  IMPORT_TASK = 0,
  OBSERVER_QUERY_TASK = 0,
  EXTERNAL_CHANGE_TASK = 1,
  USER_QUERY_TASK = 2,
  TRANSACTION_TASK = 2,
}
