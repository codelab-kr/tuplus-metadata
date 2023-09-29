//
// An example of running unit tests against the "metadata" microservice using Jest.
//
describe('metadata microservice', () => {
  //
  // Setup mocks.
  //
  const mockListenFn = jest.fn();
  const mockGetFn = jest.fn();

  jest.doMock('express', () => {
    // Mock the Express module.
    return () => {
      // The Express module is a factory function that creates an Express app object.
      return {
        // Mock Express app object.
        listen: mockListenFn,
        get: mockGetFn,
      };
    };
  });

  const mockRecord1 = {};
  const mockRecord2 = {};

  // Mock the find function to return some mock records.
  const mockVideosCollection = {
    find: () => {
      return {
        toArray: async () => {
          // This is set up to follow the convention of the Mongodb library.
          return [mockRecord1, mockRecord2];
        },
      };
    },
  };

  const mockDb = {
    // Mock Mongodb database.
    collection: () => {
      return mockVideosCollection;
    },
  };

  const mockMongoClient = {
    // Mock Mongodb client object.
    db: () => {
      return mockDb;
    },
  };

  jest.doMock('mongodb', () => {
    // Mock the Mongodb module.
    return {
      // Mock Mongodb module.
      MongoClient: {
        // Mock MongoClient.
        connect: async () => {
          // Mock connect function.
          return mockMongoClient;
        },
      },
    };
  });

  //
  // Import the module we are testing.
  //
  // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
  const { startMicroservice } = require('./index');

  //
  // Tests go here.
  //
  test('microservice starts web server on startup', async () => {
    await startMicroservice();

    expect(mockListenFn.mock.calls.length).toEqual(1); // Check only 1 call to 'listen'.
    expect(mockListenFn.mock.calls[0][0]).toEqual(4003); // Check for port 4003.
  });

  test('/videos route is handled', async () => {
    await startMicroservice();

    expect(mockGetFn).toHaveBeenCalled();

    const videosRoute = mockGetFn.mock.calls[0][0];
    expect(videosRoute).toEqual('/videos');
  });

  test('/videos route retreives data via videos collection', async () => {
    await startMicroservice();

    const mockRequest = {};
    const mockJsonFn = jest.fn();
    const mockResponse = {
      json: mockJsonFn,
    };

    const videosRouteHandler = mockGetFn.mock.calls[0][1]; // Extract the /videos route handler function.
    await videosRouteHandler(mockRequest, mockResponse); // Invoke the request handler.

    expect(mockJsonFn.mock.calls.length).toEqual(1); // Expect that the json fn was called.
    expect(mockJsonFn.mock.calls[0][0]).toEqual({
      videos: [mockRecord1, mockRecord2], // Expect that the mock records were retrieved via the mock database function.
    });
  });

  test('/video route is handled', async () => {
    await startMicroservice();

    expect(mockGetFn).toHaveBeenCalled();

    const videotRoute = mockGetFn.mock.calls[1][0];
    expect(videotRoute).toEqual('/video');
  });

  test('/video route retreives video/mp4', async () => {
    await startMicroservice();

    const mockRequest = {};
    const mockVideoFn = {
      on: jest.fn(),
      once: jest.fn(),
      write: jest.fn(),
      end: jest.fn(),
      pipe: jest.fn(),
      emit: jest.fn(),
      video: Buffer.from('mock video file'),
      length: 1055736,
      type: 'video/mp4',
    };
    const mockJsonFn = jest.fn();
    const mockResponse = {
      writeHead: mockJsonFn,
      ...mockVideoFn,
    };

    const videoRouteHandler = mockGetFn.mock.calls[1][1]; // Extract the /videos route handler function.
    await videoRouteHandler(mockRequest, mockResponse); // Invoke the request handler.

    expect(mockJsonFn.mock.calls.length).toEqual(1); // Expect that the json fn was called.
    expect(mockJsonFn.mock.calls[0][0]).toEqual(200);
    expect(mockJsonFn.mock.calls[0][1]).toEqual({
      'Content-Length': 1055736,
      'Content-Type': 'video/mp4',
    });
  });

  test('/route is handled', async () => {
    await startMicroservice();

    expect(mockGetFn).toHaveBeenCalled();

    const defaultRoute = mockGetFn.mock.calls[3][0];
    expect(defaultRoute).toEqual('/');
  });

  test('/route retreives json message', async () => {
    await startMicroservice();

    const mockRequest = {};
    const mockJsonFn = jest.fn();
    const mockResponse = {
      json: mockJsonFn,
    };

    const defaultRouteHandler = mockGetFn.mock.calls[3][1]; // Extract the /videos route handler function.
    await defaultRouteHandler(mockRequest, mockResponse); // Invoke the request handler.

    expect(mockJsonFn.mock.calls.length).toEqual(1); // Expect that the json fn was called.
    expect(mockJsonFn.mock.calls[0][0]).toEqual({
      message: 'Hello! Catch all route',
    });
    // Expect that the json fn was called.
  });
});
