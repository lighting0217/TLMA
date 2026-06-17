/**
 * Unit tests for nodeProcessor utilities
 * Example test cases - adapt to your testing framework (Jest, Vitest, etc.)
 */

/* global describe,it,expect */

import {
  normalizeNode,
  groupNodesByStadium,
  filterNodesBySearchTerm,
  detectStatusChange,
} from "./nodeProcessor";

describe("nodeProcessor", () => {
  describe("normalizeNode", () => {
    it("should parse stadium#device format correctly", () => {
      const node = {
        name: "Stadium A#Server 01",
        ip: "192.168.1.1",
        status: "ONLINE",
        ping: "5ms",
      };

      const result = normalizeNode(node);

      expect(result.group).toBe("Stadium A");
      expect(result.name).toBe("Server 01");
      expect(result.ip).toBe("192.168.1.1");
    });

    it("should use fallback group when no stadium specified", () => {
      const node = {
        name: "Server 01",
        ip: "192.168.1.1",
        status: "ONLINE",
        ping: "5ms",
      };

      const result = normalizeNode(node);

      expect(result.group).toBe("ทั่วไป");
      expect(result.name).toBe("Server 01");
    });

    it("should return null for invalid nodes", () => {
      const result1 = normalizeNode({ status: "ONLINE" }); // missing name and ip
      const result2 = normalizeNode({});

      expect(result1).toBeNull();
      expect(result2).toBeNull();
    });
  });

  describe("groupNodesByStadium", () => {
    it("should group nodes correctly by stadium", () => {
      const nodes = [
        { ip: "1.1.1.1", name: "Dev1", group: "Stadium A", status: "ONLINE" },
        { ip: "2.2.2.2", name: "Dev2", group: "Stadium A", status: "ONLINE" },
        { ip: "3.3.3.3", name: "Dev3", group: "Stadium B", status: "ONLINE" },
      ];

      const result = groupNodesByStadium(nodes);

      expect(Object.keys(result)).toEqual(["Stadium A", "Stadium B"]);
      expect(result["Stadium A"]).toHaveLength(2);
      expect(result["Stadium B"]).toHaveLength(1);
    });
  });

  describe("filterNodesBySearchTerm", () => {
    it("should filter by device name", () => {
      const grouped = {
        "Stadium A": [
          { name: "Server1", ip: "1.1.1.1", group: "Stadium A" },
          { name: "Router2", ip: "1.1.1.2", group: "Stadium A" },
        ],
      };

      const result = filterNodesBySearchTerm(grouped, "Server");

      expect(result["Stadium A"]).toHaveLength(1);
      expect(result["Stadium A"][0].name).toBe("Server1");
    });

    it("should filter by IP address", () => {
      const grouped = {
        "Stadium A": [
          { name: "Server1", ip: "192.168.1.1", group: "Stadium A" },
        ],
      };

      const result = filterNodesBySearchTerm(grouped, "192.168");

      expect(result["Stadium A"]).toHaveLength(1);
    });

    it("should filter by stadium name", () => {
      const grouped = {
        "Stadium A": [{ name: "Server1", ip: "1.1.1.1", group: "Stadium A" }],
        "Stadium B": [{ name: "Server2", ip: "2.2.2.2", group: "Stadium B" }],
      };

      const result = filterNodesBySearchTerm(grouped, "Stadium A");

      expect(Object.keys(result)).toEqual(["Stadium A"]);
    });

    it("should return all when search term is empty", () => {
      const grouped = {
        "Stadium A": [{ name: "Server1", ip: "1.1.1.1", group: "Stadium A" }],
      };

      const result = filterNodesBySearchTerm(grouped, "");

      expect(result).toEqual(grouped);
    });
  });

  describe("detectStatusChange", () => {
    it("should detect downtime transition", () => {
      const prevStatus = { "1.1.1.1": "ONLINE" };
      const node = { ip: "1.1.1.1", status: "TIMEOUT" };

      const result = detectStatusChange(prevStatus, node);

      expect(result.isStatusChanged).toBe(true);
      expect(result.isDowntime).toBe(true);
    });

    it("should not detect false positives", () => {
      const prevStatus = { "1.1.1.1": "TIMEOUT" };
      const node = { ip: "1.1.1.1", status: "TIMEOUT" };

      const result = detectStatusChange(prevStatus, node);

      expect(result.isStatusChanged).toBe(false);
      expect(result.isDowntime).toBe(false);
    });
  });
});
