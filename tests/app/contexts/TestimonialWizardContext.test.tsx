import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import React from "react";
import {
  TestimonialWizardProvider,
  useTestimonialWizard,
} from "@/contexts/TestimonialWizardContext";

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <TestimonialWizardProvider>{children}</TestimonialWizardProvider>
);

let revokeSpy: any;

beforeEach(() => {
  revokeSpy = vi.fn();
  Object.defineProperty(window, "URL", {
    configurable: true,
    value: { ...window.URL, revokeObjectURL: revokeSpy, createObjectURL: () => "blob:x" },
  });
});

describe("TestimonialWizardContext · reducer actions", () => {
  it("initial state has step=0, mediaType=null, no avatar/video", () => {
    const { result } = renderHook(() => useTestimonialWizard(), { wrapper });
    expect(result.current.state).toMatchObject({
      step: 0,
      mediaType: null,
      text: "",
      videoStorageId: null,
      avatarFile: null,
      avatarPreviewUrl: "",
      isSubmitting: false,
      isSuccess: false,
      error: null,
    });
  });

  it("SET_MEDIA_TYPE updates mediaType", () => {
    const { result } = renderHook(() => useTestimonialWizard(), { wrapper });
    act(() => result.current.dispatch({ type: "SET_MEDIA_TYPE", payload: "text" }));
    expect(result.current.state.mediaType).toBe("text");
  });

  it("SET_TEXT updates text", () => {
    const { result } = renderHook(() => useTestimonialWizard(), { wrapper });
    act(() => result.current.dispatch({ type: "SET_TEXT", payload: "Hello" }));
    expect(result.current.state.text).toBe("Hello");
  });

  it("SET_VIDEO updates video metadata", () => {
    const { result } = renderHook(() => useTestimonialWizard(), { wrapper });
    act(() =>
      result.current.dispatch({
        type: "SET_VIDEO",
        payload: { storageId: "vs1", fileSize: 100, fileName: "v.mp4" },
      }),
    );
    expect(result.current.state).toMatchObject({
      videoStorageId: "vs1",
      videoFileSize: 100,
      videoFileName: "v.mp4",
    });
  });

  it("SET_PERSONAL_INFO sets the personal info", () => {
    const { result } = renderHook(() => useTestimonialWizard(), { wrapper });
    const info = { name: "X", role: "Y", company: "Z", email: "x@y.com" };
    act(() => result.current.dispatch({ type: "SET_PERSONAL_INFO", payload: info }));
    expect(result.current.state.personalInfo).toEqual(info);
  });

  it("SET_AVATAR sets file+previewUrl and revokes previous URL", () => {
    const { result } = renderHook(() => useTestimonialWizard(), { wrapper });
    const file1 = new Blob(["x"]);
    act(() =>
      result.current.dispatch({
        type: "SET_AVATAR",
        payload: { file: file1, previewUrl: "blob:1" },
      }),
    );
    expect(result.current.state.avatarPreviewUrl).toBe("blob:1");

    const file2 = new Blob(["y"]);
    act(() =>
      result.current.dispatch({
        type: "SET_AVATAR",
        payload: { file: file2, previewUrl: "blob:2" },
      }),
    );
    expect(revokeSpy).toHaveBeenCalledWith("blob:1");
    expect(result.current.state.avatarPreviewUrl).toBe("blob:2");
  });

  it("CLEAR_AVATAR revokes URL and resets avatar state", () => {
    const { result } = renderHook(() => useTestimonialWizard(), { wrapper });
    act(() =>
      result.current.dispatch({
        type: "SET_AVATAR",
        payload: { file: new Blob(["x"]), previewUrl: "blob:abc" },
      }),
    );
    act(() => result.current.dispatch({ type: "CLEAR_AVATAR" }));
    expect(revokeSpy).toHaveBeenCalledWith("blob:abc");
    expect(result.current.state.avatarFile).toBeNull();
    expect(result.current.state.avatarPreviewUrl).toBe("");
  });

  it("NEXT_STEP increments step and clears error", () => {
    const { result } = renderHook(() => useTestimonialWizard(), { wrapper });
    act(() => result.current.dispatch({ type: "SUBMIT_ERROR", payload: "boom" }));
    act(() => result.current.dispatch({ type: "NEXT_STEP" }));
    expect(result.current.state.step).toBe(1);
    expect(result.current.state.error).toBeNull();
  });

  it("PREV_STEP decrements step but never below 0", () => {
    const { result } = renderHook(() => useTestimonialWizard(), { wrapper });
    act(() => result.current.dispatch({ type: "PREV_STEP" }));
    expect(result.current.state.step).toBe(0);

    act(() => result.current.dispatch({ type: "NEXT_STEP" }));
    act(() => result.current.dispatch({ type: "PREV_STEP" }));
    expect(result.current.state.step).toBe(0);
  });

  it("SUBMIT_START / SUBMIT_SUCCESS / SUBMIT_ERROR transitions", () => {
    const { result } = renderHook(() => useTestimonialWizard(), { wrapper });
    act(() => result.current.dispatch({ type: "SUBMIT_START" }));
    expect(result.current.state.isSubmitting).toBe(true);

    act(() => result.current.dispatch({ type: "SUBMIT_SUCCESS" }));
    expect(result.current.state.isSubmitting).toBe(false);
    expect(result.current.state.isSuccess).toBe(true);

    act(() => result.current.dispatch({ type: "SUBMIT_ERROR", payload: "fail" }));
    expect(result.current.state.error).toBe("fail");
  });

  it("RESET returns to initial state", () => {
    const { result } = renderHook(() => useTestimonialWizard(), { wrapper });
    act(() => result.current.dispatch({ type: "SET_TEXT", payload: "Hi" }));
    act(() => result.current.dispatch({ type: "NEXT_STEP" }));
    act(() => result.current.dispatch({ type: "RESET" }));
    expect(result.current.state.step).toBe(0);
    expect(result.current.state.text).toBe("");
  });

  it("throws when used outside provider", () => {
    expect(() => renderHook(() => useTestimonialWizard())).toThrow(
      /must be used inside TestimonialWizardProvider/,
    );
  });
});
