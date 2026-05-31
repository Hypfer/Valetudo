const assert = require("node:assert");
const { describe, it } = require("node:test");

const ValetudoEventStore = require("../../lib/ValetudoEventStore");
const {
    DustBinFullValetudoEvent,
    ValetudoRuntimeErrorValetudoEvent,
    ConsumableDepletedValetudoEvent
} = require("../../lib/valetudo_events/events");

describe("ValetudoEventStore", () => {
    describe("rehydrateEvents", () => {
        it("correctly reconstructs standard events from a serialized JSON representation", () => {
            const store = new ValetudoEventStore({});

            const originalEvents = [
                new DustBinFullValetudoEvent({
                    id: "evt_1",
                    processed: true,
                    timestamp: new Date("2024-01-01T10:00:00.000Z")
                }),
                new ValetudoRuntimeErrorValetudoEvent({
                    id: "evt_2",
                    reason: ValetudoRuntimeErrorValetudoEvent.REASONS.MEMORY_USAGE,
                    generation: 2,
                    description: "Test error context",
                    timestamp: new Date("2024-01-02T10:00:00.000Z")
                }),
                new ConsumableDepletedValetudoEvent({
                    id: "evt_3",
                    type: "brush",
                    subType: "main",
                    timestamp: new Date("2024-01-03T10:00:00.000Z")
                })
            ];

            const serializedEvents = JSON.stringify(originalEvents);
            const parsedEvents = JSON.parse(serializedEvents);

            store.rehydrateEvents(parsedEvents);

            const rehydratedEvents = store.getAll();

            assert.strictEqual(rehydratedEvents.length, 3);

            const evt1 = rehydratedEvents.find(e => e.id === "evt_1");
            assert.ok(evt1 instanceof DustBinFullValetudoEvent);
            assert.strictEqual(evt1.processed, true);
            assert.strictEqual(evt1.timestamp.toISOString(), "2024-01-01T10:00:00.000Z");

            const evt2 = rehydratedEvents.find(e => e.id === "evt_2");
            assert.ok(evt2 instanceof ValetudoRuntimeErrorValetudoEvent);
            assert.strictEqual(evt2.reason, ValetudoRuntimeErrorValetudoEvent.REASONS.MEMORY_USAGE);
            assert.strictEqual(evt2.generation, 2);
            assert.strictEqual(evt2.description, "Test error context");
            assert.strictEqual(evt2.processed, false);
            assert.strictEqual(evt2.timestamp.toISOString(), "2024-01-02T10:00:00.000Z");

            const evt3 = rehydratedEvents.find(e => e.id === "consumable_depleted_brush_main");
            assert.ok(evt3 instanceof ConsumableDepletedValetudoEvent);
            assert.strictEqual(evt3.type, "brush");
            assert.strictEqual(evt3.subType, "main");
            assert.strictEqual(evt3.processed, false);
            assert.strictEqual(evt3.timestamp.toISOString(), "2024-01-03T10:00:00.000Z");
        });

        it("gracefully ignores unknown event classes", () => {
            const store = new ValetudoEventStore({});

            const maliciousPayload = [
                {
                    __class: "DoesNotExistValetudoEvent",
                    id: "bad_evt",
                    timestamp: new Date().toISOString()
                },
                {
                    __class: "DustBinFullValetudoEvent",
                    id: "good_evt",
                    timestamp: new Date().toISOString()
                }
            ];

            store.rehydrateEvents(maliciousPayload);

            const rehydratedEvents = store.getAll();
            assert.strictEqual(rehydratedEvents.length, 1);
            assert.ok(rehydratedEvents[0] instanceof DustBinFullValetudoEvent);
            assert.strictEqual(rehydratedEvents[0].id, "good_evt");
        });
    });
});
