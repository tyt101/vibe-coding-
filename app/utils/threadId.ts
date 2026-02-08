// 兼容性更好的 UUID 生成函数
function generateUUID(): string {
    // 首先尝试使用 crypto.randomUUID()
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        try {
            return crypto.randomUUID();
        } catch {
            console.warn('crypto.randomUUID() failed, falling back to manual generation');
        }
    }

    // 手动生成 UUID v4
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

export function getOrCreateThreadId() {

    return generateUUID();
}
