import { get } from 'lodash'

import type { Cb } from "@/service/interface/function"

interface ConstructorInput {
    /**tên của db */
    database_name: string
    /**phiên bản của db */
    database_version: number
    /**tên của bảng */
    database_table: string
    /**??? */
    database_key_path: string
}

/**
 * kết nối đến indexedDB của trình duyệt
 * cung cấp một số phương thức viết sẵn
 */
export class IndexedDB {
    public database_name: ConstructorInput['database_name'] = 'common'
    public database_version: ConstructorInput['database_version'] = 1
    public database_table: ConstructorInput['database_table'] = 'common'
    public database_key_path: ConstructorInput['database_key_path'] = 'key'

    private db?: IDBDatabase

    constructor(input?: ConstructorInput) {
        if (input?.database_name) this.database_name = input?.database_name
        if (input?.database_version) this.database_version = input?.database_version
        if (input?.database_table) this.database_table = input?.database_table
        if (input?.database_key_path) this.database_key_path = input?.database_key_path

        this.init()
    }

    /**khởi tạo local db */
    private init() {
        let _this = this

        // tạo yêu cầu mở kết nối đến local db
        const CONNECTION = indexedDB.open(
            this.database_name,
            this.database_version
        )

        // kết nối thành công
        CONNECTION.onsuccess = function ($event) { _this.db = this.result }

        // kết nối thất bại
        CONNECTION.onerror = $event => console.log(
            'Local database error:',
            $event
        )

        // sự kiện khi thay đổi phiên bản của db
        CONNECTION.onupgradeneeded = function ($event: any) {
            _this.db = undefined

            const STORE = $event
                .target
                .result
                .createObjectStore(
                    _this.database_table,
                    { keyPath: _this.database_key_path }
                )

            STORE.transaction.oncomplete = ($event: any) => {
                _this.db = $event.target.db
            }
        }
    }

    /**đọc dữ liệu từ db theo key */
    public get(key: string, proceed: Cb) {
        if (!this.db) return setTimeout(() => this.get(key, proceed), 50)

        this.db
            .transaction(this.database_table)
            .objectStore(this.database_table)
            .get(key)
            .onsuccess = $event => proceed(
                null,
                get($event, 'target.result.value')
            )
    }
    /**ghi dữ liệu vào db */
    public set(key: string, value: any, proceed: Cb) {
        // nếu không có dữ liệu thì thôi
        if (!value) return proceed()

        if (!this.db) return setTimeout(() => this.set(key, value, proceed), 50)

        const CONNECTION = this.db.transaction(this.database_table, 'readwrite')

        CONNECTION.oncomplete = $event => proceed()

        CONNECTION
            .objectStore(this.database_table)
            .put({ 'key': key, 'value': JSON.parse(JSON.stringify(value)) })

        CONNECTION.commit()
    }
    /**xoá một dữ liệu theo key */
    public del(key: string, proceed: Cb) {
        if (!this.db) return setTimeout(() => this.del(key, proceed), 50)

        this
            .db
            .transaction(this.database_table, 'readwrite')
            .objectStore(this.database_table)
            .delete(key)
            .onsuccess = (event) => proceed()
    }
    /**lấy ra toàn bộ key trong bảng */
    public keys(proceed: Cb) {
        if (!this.db) return setTimeout(() => this.keys(proceed), 50)

        this
            .db
            .transaction(this.database_table)
            .objectStore(this.database_table)
            .getAllKeys()
            .onsuccess = $event => proceed(
                null,
                get($event, 'target.result')
            )
    }
    /**lấy ra toàn bộ dữ liệu trong bảng */
    public getAll(proceed: Cb) {
        if (!this.db) return setTimeout(() => this.getAll(proceed), 50)

        this
            .db
            .transaction(this.database_table)
            .objectStore(this.database_table)
            .getAll()
            .onsuccess = $event => proceed(
                null,
                get($event, 'target.result')
            )
    }
    /**xoá toàn bộ bảng */
    public clear(proceed: Cb) {
        if (!this.db) return setTimeout(() => this.clear(proceed), 50)

        this
            .db
            .transaction(this.database_table, 'readwrite')
            .objectStore(this.database_table)
            .clear()
            .onsuccess = $event => proceed()
    }
}