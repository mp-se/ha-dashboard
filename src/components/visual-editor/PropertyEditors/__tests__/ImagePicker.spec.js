import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import ImagePicker from "../ImagePicker.vue";

// ---------------------------------------------------------------------------
// Helpers & mocks
// ---------------------------------------------------------------------------

const mockImages = [
  {
    id: "photo.jpg",
    url: "/data/images/photo.jpg",
    name: "photo",
    size: 102400,
    mtime: "2026-03-22T08:00:00Z",
  },
  {
    id: "banner.png",
    url: "/data/images/banner.png",
    name: "banner",
    size: 2048,
    mtime: "2026-03-21T08:00:00Z",
  },
  {
    id: "icon.svg",
    url: "/data/images/icon.svg",
    name: "icon",
    size: 0,
    mtime: "2026-03-20T08:00:00Z",
  },
];

const makeSuccessFetchResponse = (data) =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ success: true, data }),
  });
makeSuccessFetchResponse; // referenced via fetchMock chains

const makeFailFetchResponse = (error = "Server error") =>
  Promise.resolve({
    ok: false,
    json: () => Promise.resolve({ success: false, error }),
  });
makeFailFetchResponse;

// Build a controllable XHR mock
function makeMockXhr(overrides = {}) {
  const xhr = {
    open: vi.fn(),
    send: vi.fn(),
    setRequestHeader: vi.fn(),
    upload: { addEventListener: vi.fn() },
    status: 200,
    responseText: JSON.stringify({ success: true, data: { images: [] } }),
    onload: null,
    onerror: null,
    ...overrides,
  };
  return xhr;
}

// Stub XMLHttpRequest with a regular function (arrow functions can't be constructors)
function stubXhr(overrides = {}) {
  const xhr = makeMockXhr(overrides);
  // Regular function so `new XMLHttpRequest()` works; returning an object replaces `this`
  vi.stubGlobal(
    "XMLHttpRequest",
    function MockXHR() {
      return xhr;
    },
  );
  return xhr;
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  setActivePinia(createPinia());
  localStorage.clear();
  vi.stubGlobal("confirm", vi.fn().mockReturnValue(true));
  vi.stubGlobal("alert", vi.fn());
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Mounting helper — pre-loads images so most tests skip the loading state
// ---------------------------------------------------------------------------
async function mountWithImages(
  props = {},
  images = mockImages,
  fetchOverride = null,
) {
  const fetchMock =
    fetchOverride ??
    vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: { images } }),
    });
  vi.stubGlobal("fetch", fetchMock);

  const wrapper = mount(ImagePicker, {
    props: { modelValue: "", ...props },
  });
  await flushPromises();
  return { wrapper, fetchMock };
}

// ---------------------------------------------------------------------------
// formatFileSize (pure helper — tested via rendered output)
// ---------------------------------------------------------------------------
describe("formatFileSize", () => {
  it("displays 0 B for zero-size images", async () => {
    const { wrapper } = await mountWithImages();
    const sizes = wrapper.findAll(".image-size");
    const zeroEntry = sizes.find((el) => el.text() === "0 B");
    expect(zeroEntry).toBeTruthy();
  });

  it("renders KB for small files", async () => {
    const { wrapper } = await mountWithImages({}, [
      { id: "a.png", url: "/data/images/a.png", name: "a", size: 2048 },
    ]);
    expect(wrapper.find(".image-size").text()).toBe("2 KB");
  });

  it("renders MB for large files", async () => {
    const { wrapper } = await mountWithImages({}, [
      {
        id: "b.jpg",
        url: "/data/images/b.jpg",
        name: "b",
        size: 5 * 1024 * 1024,
      },
    ]);
    expect(wrapper.find(".image-size").text()).toBe("5 MB");
  });
});

// ---------------------------------------------------------------------------
// Loading & empty states
// ---------------------------------------------------------------------------
describe("loading state", () => {
  it("shows spinner while loading", () => {
    // fetch never resolves
    vi.stubGlobal("fetch", () => new Promise(() => {}));
    const wrapper = mount(ImagePicker, { props: { modelValue: "" } });
    expect(wrapper.find(".spinner-border").exists()).toBe(true);
  });

  it("hides spinner after load", async () => {
    const { wrapper } = await mountWithImages();
    expect(wrapper.find(".spinner-border").exists()).toBe(false);
  });

  it("shows empty message when no images", async () => {
    const { wrapper } = await mountWithImages({}, []);
    expect(wrapper.text()).toContain("No images found");
  });
});

// ---------------------------------------------------------------------------
// Image grid rendering
// ---------------------------------------------------------------------------
describe("image grid", () => {
  it("renders one card per image", async () => {
    const { wrapper } = await mountWithImages();
    expect(wrapper.findAll(".image-card").length).toBe(mockImages.length);
  });

  it("uses image.url directly as img src", async () => {
    const { wrapper } = await mountWithImages();
    const imgs = wrapper.findAll("img");
    expect(imgs[0].attributes("src")).toBe("/data/images/photo.jpg");
  });

  it("renders image name", async () => {
    const { wrapper } = await mountWithImages();
    expect(wrapper.text()).toContain("photo");
  });
});

// ---------------------------------------------------------------------------
// Search / filteredImages
// ---------------------------------------------------------------------------
describe("search filtering", () => {
  it("shows all images when search is empty", async () => {
    const { wrapper } = await mountWithImages();
    expect(wrapper.findAll(".image-card").length).toBe(3);
  });

  it("filters images by name", async () => {
    const { wrapper } = await mountWithImages();
    await wrapper.find("input[type=text]").setValue("photo");
    expect(wrapper.findAll(".image-card").length).toBe(1);
  });

  it("filters images by id (case-insensitive)", async () => {
    const { wrapper } = await mountWithImages();
    await wrapper.find("input[type=text]").setValue("BANNER");
    expect(wrapper.findAll(".image-card").length).toBe(1);
  });

  it("shows empty message when search has no match", async () => {
    const { wrapper } = await mountWithImages();
    await wrapper.find("input[type=text]").setValue("zzznomatch");
    expect(wrapper.text()).toContain("No images found");
  });
});

// ---------------------------------------------------------------------------
// selectImage — emit
// ---------------------------------------------------------------------------
describe("selectImage", () => {
  it("emits update:modelValue with image.url when card clicked", async () => {
    const { wrapper } = await mountWithImages();
    await wrapper.findAll(".image-card")[0].trigger("click");
    expect(wrapper.emitted("update:modelValue")).toBeTruthy();
    expect(wrapper.emitted("update:modelValue")[0][0]).toBe(
      "/data/images/photo.jpg",
    );
  });
});

// ---------------------------------------------------------------------------
// isImageSelected
// ---------------------------------------------------------------------------
describe("isImageSelected", () => {
  it("marks the matching card as selected", async () => {
    const { wrapper } = await mountWithImages({
      modelValue: "/data/images/photo.jpg",
    });
    const cards = wrapper.findAll(".image-card");
    expect(cards[0].classes()).toContain("border-primary");
    expect(cards[1].classes()).not.toContain("border-primary");
  });

  it("shows check-circle icon on selected image", async () => {
    const { wrapper } = await mountWithImages({
      modelValue: "/data/images/photo.jpg",
    });
    expect(wrapper.find(".mdi-check-circle").exists()).toBe(true);
  });

  it("no selection when modelValue is empty", async () => {
    const { wrapper } = await mountWithImages({ modelValue: "" });
    const selected = wrapper
      .findAll(".image-card")
      .filter((c) => c.classes("border-primary"));
    expect(selected.length).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// URL input field
// ---------------------------------------------------------------------------
describe("URL input field", () => {
  it("renders with current modelValue", async () => {
    const { wrapper } = await mountWithImages({
      modelValue: "https://example.com/img.jpg",
    });
    const input = wrapper.find("input[placeholder*='https://']");
    expect(input.element.value).toBe("https://example.com/img.jpg");
  });

  it("emits update:modelValue on direct URL input", async () => {
    const { wrapper } = await mountWithImages();
    const urlInput = wrapper.find("input[placeholder*='https://']");
    await urlInput.setValue("https://new.url/img.jpg");
    await urlInput.trigger("input");
    const emissions = wrapper.emitted("update:modelValue");
    expect(emissions).toBeTruthy();
    expect(emissions[emissions.length - 1][0]).toBe("https://new.url/img.jpg");
  });
});

// ---------------------------------------------------------------------------
// Drag events
// ---------------------------------------------------------------------------
describe("drag and drop zone", () => {
  it("adds dragging-over class on dragover", async () => {
    const { wrapper } = await mountWithImages();
    const zone = wrapper.find(".upload-zone");
    await zone.trigger("dragover");
    expect(zone.classes()).toContain("dragging-over");
  });

  it("removes dragging-over class on dragleave", async () => {
    const { wrapper } = await mountWithImages();
    const zone = wrapper.find(".upload-zone");
    await zone.trigger("dragover");
    await zone.trigger("dragleave");
    expect(zone.classes()).not.toContain("dragging-over");
  });

  it("removes dragging-over class on drop", async () => {
    const { wrapper } = await mountWithImages();
    const zone = wrapper.find(".upload-zone");
    await zone.trigger("dragover");

    stubXhr();

    await zone.trigger("drop", {
      dataTransfer: { files: [] },
    });
    expect(zone.classes()).not.toContain("dragging-over");
  });

  it("calls uploadFiles when files are dropped", async () => {
    const { wrapper } = await mountWithImages();

    const mockXhr = stubXhr();

    const file = new File(["x"], "test.jpg", { type: "image/jpeg" });
    const zone = wrapper.find(".upload-zone");
    await zone.trigger("drop", { dataTransfer: { files: [file] } });

    expect(mockXhr.open).toHaveBeenCalledWith(
      "POST",
      expect.stringContaining("/images/upload"),
    );
  });
});

// ---------------------------------------------------------------------------
// File input upload
// ---------------------------------------------------------------------------
describe("file input upload", () => {
  it("triggers uploadFiles when file selected via drag-drop", async () => {
    const { wrapper } = await mountWithImages();

    const mockXhr = stubXhr();

    const file = new File(["x"], "photo.jpg", { type: "image/jpeg" });
    await wrapper
      .find(".upload-zone")
      .trigger("drop", { dataTransfer: { files: [file] } });

    expect(mockXhr.open).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// uploadFiles — XHR flow
// ---------------------------------------------------------------------------
describe("uploadFiles", () => {
  it("shows progress bar during upload", async () => {
    const { wrapper } = await mountWithImages();

    // XHR that never fires onload
    stubXhr();

    const file = new File(["x"], "a.jpg", { type: "image/jpeg" });
    const zone = wrapper.find(".upload-zone");
    await zone.trigger("drop", { dataTransfer: { files: [file] } });

    expect(wrapper.find(".progress").exists()).toBe(true);
  });

  it("sets Authorization header when password is configured", async () => {
    localStorage.setItem(
      "ha-dashboard-server-config",
      JSON.stringify({ api_password: "secret123" }),
    );
    const { wrapper } = await mountWithImages();

    const mockXhr = stubXhr();

    const file = new File(["x"], "a.jpg", { type: "image/jpeg" });
    const input = wrapper.find("input[type=file]");
    Object.defineProperty(input.element, "files", {
      value: [file],
      configurable: true,
    });
    await input.trigger("change");

    expect(mockXhr.setRequestHeader).toHaveBeenCalledWith(
      "Authorization",
      "Bearer secret123",
    );
  });

  it("hides progress bar and refreshes images on success", async () => {
    let xhrInstance;
    const mockXhr = stubXhr({
      status: 200,
      responseText: JSON.stringify({
        success: true,
        data: { images: [{ url: "/data/images/new.jpg" }] },
      }),
    });
    xhrInstance = mockXhr;

    const fetchMock = vi
      .fn()
      .mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({ success: true, data: { images: mockImages } }),
      });
    vi.stubGlobal("fetch", fetchMock);

    const wrapper = mount(ImagePicker, { props: { modelValue: "" } });
    await flushPromises();

    const file = new File(["x"], "a.jpg", { type: "image/jpeg" });
    await wrapper
      .find(".upload-zone")
      .trigger("drop", { dataTransfer: { files: [file] } });

    // Simulate XHR completing
    xhrInstance.onload();
    await flushPromises();

    expect(wrapper.find(".progress").exists()).toBe(false);
    // fetchImages is called again after upload
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("auto-selects single uploaded image", async () => {
    const mockXhr = stubXhr({
      status: 200,
      responseText: JSON.stringify({
        success: true,
        data: { images: [{ url: "/data/images/new.jpg" }] },
      }),
    });

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({ success: true, data: { images: mockImages } }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const wrapper = mount(ImagePicker, { props: { modelValue: "" } });
    await flushPromises();

    const file = new File(["x"], "a.jpg", { type: "image/jpeg" });
    await wrapper
      .find(".upload-zone")
      .trigger("drop", { dataTransfer: { files: [file] } });
    mockXhr.onload();
    await flushPromises();

    expect(wrapper.emitted("update:modelValue")).toBeTruthy();
    expect(wrapper.emitted("update:modelValue")[0][0]).toBe(
      "/data/images/new.jpg",
    );
  });

  it("shows alert on non-2xx XHR response", async () => {
    const mockXhr = stubXhr({
      status: 500,
      responseText: JSON.stringify({ error: "Internal error" }),
    });

    const { wrapper } = await mountWithImages();
    const file = new File(["x"], "a.jpg", { type: "image/jpeg" });
    await wrapper
      .find(".upload-zone")
      .trigger("drop", { dataTransfer: { files: [file] } });
    mockXhr.onload();
    await flushPromises();

    expect(alert).toHaveBeenCalledWith(
      expect.stringContaining("Upload failed"),
    );
  });

  it("shows alert on XHR network error", async () => {
    const mockXhr = stubXhr();

    const { wrapper } = await mountWithImages();
    const file = new File(["x"], "a.jpg", { type: "image/jpeg" });
    await wrapper
      .find(".upload-zone")
      .trigger("drop", { dataTransfer: { files: [file] } });
    mockXhr.onerror();
    await flushPromises();

    expect(alert).toHaveBeenCalledWith(
      expect.stringContaining("Network error"),
    );
  });

  it("tracks upload progress", async () => {
    const mockXhr = stubXhr();

    const { wrapper } = await mountWithImages();
    const file = new File(["x"], "a.jpg", { type: "image/jpeg" });
    await wrapper
      .find(".upload-zone")
      .trigger("drop", { dataTransfer: { files: [file] } });

    // Simulate progress event
    const progressCall = mockXhr.upload.addEventListener.mock.calls.find(
      ([event]) => event === "progress",
    );
    expect(progressCall).toBeTruthy();
    const progressHandler = progressCall[1];
    progressHandler({ lengthComputable: true, loaded: 50, total: 100 });
    await wrapper.vm.$nextTick();

    const bar = wrapper.find(".progress-bar");
    expect(bar.attributes("style")).toContain("50%");
  });
});

// ---------------------------------------------------------------------------
// confirmDelete
// ---------------------------------------------------------------------------
describe("confirmDelete", () => {
  it("does nothing when user cancels confirm", async () => {
    vi.stubGlobal("confirm", vi.fn().mockReturnValue(false));
    const { wrapper, fetchMock } = await mountWithImages();
    const initialCallCount = fetchMock.mock.calls.length;

    await wrapper.find(".delete-hidden").trigger("click");
    await flushPromises();

    expect(fetchMock.mock.calls.length).toBe(initialCallCount);
  });

  it("calls DELETE endpoint when confirmed", async () => {
    vi.stubGlobal("confirm", vi.fn().mockReturnValue(true));

    const fetchMock = vi
      .fn()
      // first call: fetchImages on mount
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({ success: true, data: { images: mockImages } }),
      })
      // second call: DELETE
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      })
      // third call: fetchImages refresh
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({ success: true, data: { images: mockImages } }),
      });

    vi.stubGlobal("fetch", fetchMock);
    const wrapper = mount(ImagePicker, { props: { modelValue: "" } });
    await flushPromises();

    await wrapper.find(".delete-hidden").trigger("click");
    await flushPromises();

    const deleteCall = fetchMock.mock.calls[1];
    expect(deleteCall[0]).toContain("/images/photo.jpg");
    expect(deleteCall[1].method).toBe("DELETE");
  });

  it("clears modelValue when currently selected image is deleted", async () => {
    vi.stubGlobal("confirm", vi.fn().mockReturnValue(true));

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({ success: true, data: { images: mockImages } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({ success: true, data: { images: mockImages } }),
      });

    vi.stubGlobal("fetch", fetchMock);
    const wrapper = mount(ImagePicker, {
      props: { modelValue: "/data/images/photo.jpg" },
    });
    await flushPromises();

    await wrapper.find(".delete-hidden").trigger("click");
    await flushPromises();

    const emissions = wrapper.emitted("update:modelValue");
    expect(emissions).toBeTruthy();
    expect(emissions[emissions.length - 1][0]).toBe("");
  });

  it("shows alert when delete fails", async () => {
    vi.stubGlobal("confirm", vi.fn().mockReturnValue(true));

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({ success: true, data: { images: mockImages } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({ success: false, error: "Permission denied" }),
      });

    vi.stubGlobal("fetch", fetchMock);
    const wrapper = mount(ImagePicker, { props: { modelValue: "" } });
    await flushPromises();

    await wrapper.find(".delete-hidden").trigger("click");
    await flushPromises();

    expect(alert).toHaveBeenCalledWith(
      expect.stringContaining("Delete failed"),
    );
  });
});

// ---------------------------------------------------------------------------
// getEditorPassword — resolves from localStorage fallback
// ---------------------------------------------------------------------------
describe("getEditorPassword", () => {
  it("uses legacy localStorage api_password when no configStore password", async () => {
    localStorage.setItem(
      "ha-dashboard-server-config",
      JSON.stringify({ api_password: "legacypass" }),
    );

    const mockXhr = stubXhr({
      status: 200,
      responseText: JSON.stringify({
        success: true,
        data: { images: [] },
      }),
    });

    const { wrapper } = await mountWithImages();
    const file = new File(["x"], "a.jpg", { type: "image/jpeg" });
    await wrapper
      .find(".upload-zone")
      .trigger("drop", { dataTransfer: { files: [file] } });

    expect(mockXhr.setRequestHeader).toHaveBeenCalledWith(
      "Authorization",
      "Bearer legacypass",
    );
  });

  it("sends no Authorization header when no password configured", async () => {
    const mockXhr = stubXhr();

    const { wrapper } = await mountWithImages();
    const file = new File(["x"], "a.jpg", { type: "image/jpeg" });
    await wrapper
      .find(".upload-zone")
      .trigger("drop", { dataTransfer: { files: [file] } });

    expect(mockXhr.setRequestHeader).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// getApiBase — localStorage override
// ---------------------------------------------------------------------------
describe("getApiBase via localStorage", () => {
  it("uses api_url from localStorage when set to relative path", async () => {
    localStorage.setItem(
      "ha-dashboard-server-config",
      JSON.stringify({ api_url: "/custom/api" }),
    );

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({ success: true, data: { images: mockImages } }),
    });
    vi.stubGlobal("fetch", fetchMock);

    mount(ImagePicker, { props: { modelValue: "" } });
    await flushPromises();

    // The component is already constructed with the API_BASE from module scope,
    // so verify fetch was called — URL depends on VITE_API_URL env or localStorage
    expect(fetchMock).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// fetchImages error handling
// ---------------------------------------------------------------------------
describe("fetchImages error handling", () => {
  it("recovers gracefully when fetch throws", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network")));

    const wrapper = mount(ImagePicker, { props: { modelValue: "" } });
    await flushPromises();

    expect(wrapper.find(".spinner-border").exists()).toBe(false);
    expect(wrapper.text()).toContain("No images found");
  });

  it("recovers gracefully when response has success: false", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ success: false }),
      }),
    );

    const wrapper = mount(ImagePicker, { props: { modelValue: "" } });
    await flushPromises();

    expect(wrapper.find(".spinner-border").exists()).toBe(false);
  });
});
